import os
import joblib
import pandas as pd
import itertools
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from pathlib import Path
from typing import List

# --- 1. Setup: Load Model and Define Paths ---
try:
    # Use pathlib for a robust path to the project root
    FILE_DIR = Path(__file__).parent  # This is the .../endpoints directory
    ROOT_DIR = FILE_DIR.parents[4]    # 0=v1, 1=api, 2=app, 3=backend, 4=ClimateX
    MODEL_PATH = ROOT_DIR / "model_artifacts" / "robust_simulator_pipeline.joblib"
    
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at calculated path: {MODEL_PATH}")

    model_pipeline = joblib.load(MODEL_PATH)
    print(f"✅ Recommender loaded model from: {MODEL_PATH}")

    # --- 2. Get Feature Names from the Model ---
    # We get the feature categories *directly* from the trained pipeline
    # This ensures we always use the right features
    preprocessor = model_pipeline.named_steps['preprocessor']
    ohe_transformer = preprocessor.named_transformers_['cat']
    
    # Get the names of the categorical features the model was trained on
    # [ 'pollutant', 'policy_type', 'action_type' ]
    CATEGORICAL_FEATURES = preprocessor.transformers_[0][2]
    
    # Get all the unique *values* (categories) the model learned
    # This gives us a list of lists, e.g., [['EDGAR_CO2', ...], ['Investment', ...]]
    FEATURE_CATEGORIES = ohe_transformer.categories_
    
    # Define the class we want to optimize for (must match the label from training)
    OPTIMIZATION_TARGET_CLASS = "Good Impact"
    
    if OPTIMIZATION_TARGET_CLASS not in model_pipeline.classes_:
        print(f"❌ WARNING: Target class '{OPTIMIZATION_TARGET_CLASS}' not found in model classes.")
        print(f"   Available classes: {model_pipeline.classes_}")
        # As a fallback, just pick the first class
        OPTIMIZATION_TARGET_CLASS = model_pipeline.classes_[0]
        print(f"   Falling back to: {OPTIMIZATION_TARGET_CLASS}")


except Exception as e:
    print(f"❌ CRITICAL STARTUP ERROR (Recommender): {e}")
    model_pipeline = None

router = APIRouter()

# --- 3. Define API Input (Response) ---
class Recommendation(BaseModel):
    policy_type: str
    action_type: str
    pollutant: str
    confidence: float
    predicted_class: str

class RecommendationResponse(BaseModel):
    recommendations: List[Recommendation]

# --- 4. Define the API Endpoint ---

@router.get("/", response_model=RecommendationResponse)
async def get_recommendations(
    pollutant: str = Query(..., description="The specific pollutant to target, e.g., 'EDGAR_CO2'"),
    policy_year: int = Query(2025, description="The year to simulate for"),
    top_n: int = Query(5, description="The number of recommendations to return")
):
    """
    Recommends the best policy combinations to achieve a "Good Impact"
    for a specific pollutant.
    """
    if not model_pipeline:
        raise HTTPException(status_code=503, detail="Recommender model is not loaded.")

    # --- Step 1: Generate all possible scenarios ---
    
    # Get the 'policy_type' and 'action_type' categories
    try:
        policy_type_options = FEATURE_CATEGORIES[CATEGORICAL_FEATURES.index('policy_type')]
        action_type_options = FEATURE_CATEGORIES[CATEGORICAL_FEATURES.index('action_type')]
    except (ValueError, IndexError):
        raise HTTPException(status_code=500, detail="Model feature names mismatch.")

    # Create all combinations
    all_combinations = list(itertools.product(policy_type_options, action_type_options))
    
    # Create the input DataFrame
    df_scenarios = pd.DataFrame(all_combinations, columns=['policy_type', 'action_type'])
    df_scenarios['pollutant'] = pollutant
    df_scenarios['policy_year'] = policy_year
    
    # Re-order columns to match model's training order
    df_scenarios = df_scenarios[CATEGORICAL_FEATURES + ['policy_year']]

    # --- Step 2: Get predictions for all scenarios ---
    try:
        # Get the probabilities for ALL classes for ALL scenarios
        all_probabilities = model_pipeline.predict_proba(df_scenarios)
        
        # Get the predicted class for ALL scenarios
        all_predictions = model_pipeline.predict(df_scenarios)
        
        # Find the column index for our target class (e.g., "Good Impact")
        target_class_index = list(model_pipeline.classes_).index(OPTIMIZATION_TARGET_CLASS)
        
        # Get the specific confidence score for our target class
        df_scenarios['confidence'] = all_probabilities[:, target_class_index]
        df_scenarios['predicted_class'] = all_predictions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    # --- Step 3: Sort and format the results ---
    
    # Sort by the confidence in "Good Impact", descending
    df_top_results = df_scenarios.sort_values(by='confidence', ascending=False).head(top_n)

    # Format for the API response
    recommendations = [
        Recommendation(
            policy_type=row.policy_type,
            action_type=row.action_type,
            pollutant=row.pollutant,
            confidence=row.confidence,
            predicted_class=row.predicted_class
        )
        for index, row in df_top_results.iterrows()
    ]
    
    return RecommendationResponse(recommendations=recommendations)