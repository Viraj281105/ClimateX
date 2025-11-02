import os
import joblib
import pandas as pd
import ollama
import json
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict

# --- 1. Setup: Load COMBINED Model (V3) ---
try:
    FILE_DIR = Path(__file__).parent
    ROOT_DIR = FILE_DIR.parents[4]
    
    # --- UPDATED ---
    MODEL_PATH = ROOT_DIR / "model_artifacts" / "robust_simulator_pipeline_v3.joblib"
    CANDIDATES_PATH = ROOT_DIR / "data" / "processed" / "recommendation_candidates.csv"
    
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at: {MODEL_PATH}")
    if not CANDIDATES_PATH.exists():
        raise FileNotFoundError(f"Candidates file not found at: {CANDIDATES_PATH}")

    model_pipeline = joblib.load(MODEL_PATH)
    df_candidates = pd.read_csv(CANDIDATES_PATH)
    
    ollama_client = ollama.Client()
    EMBEDDING_MODEL = 'nomic-embed-text'
    
    ollama_client.list()
    print(f"✅ Recommender loaded V3 model from: {MODEL_PATH}")
    print(f"✅ Recommender loaded {len(df_candidates)} candidates from: {CANDIDATES_PATH}")

    # --- 2. Get Model Configuration ---
    OPTIMIZATION_TARGET_CLASS = "Good Impact"
    NUM_EMBEDDING_FEATURES = 768

    if OPTIMIZATION_TARGET_CLASS not in model_pipeline.classes_:
        print(f"❌ WARNING: Target class '{OPTIMIZATION_TARGET_CLASS}' not found.")
        OPTIMIZATION_TARGET_CLASS = model_pipeline.classes_[0] # Fallback
        print(f"   Falling back to: {OPTIMIZATION_TARGET_CLASS}")

except Exception as e:
    print(f"❌ CRITICAL STARTUP ERROR (Recommender): {e}")
    model_pipeline = None
    ollama_client = None
    df_candidates = None

router = APIRouter()

# --- 3. Define API Response ---
class Recommendation(BaseModel):
    policy_name: str
    policy_text: str
    pollutant: str
    confidence_in_good_impact: float
    predicted_class: str
    policy_type_debug: str
    action_type_debug: str

class RecommendationResponse(BaseModel):
    recommendations: List[Recommendation]

# --- 4. Helper Functions (Copied from simulator.py) ---

def get_policy_features_simple(policy_content: str) -> Dict[str, str]:
    # (Identical to the simulator's helper)
    if not ollama_client: return {'policy_type': 'Error', 'action_type': 'Error'}
    prompt = f"""
    You are an expert policy analyst. Classify the text.
    Your response MUST be a valid JSON object with "policy_type" and "action_type".
    1. "policy_type": (e.g., 'RenewableEnergy', 'EnergyEfficiency', 'Transport', 'Industrial', 'Framework', 'Other')
    2. "action_type": (e.g., 'Regulation', 'Standard', 'Investment', 'R&D', 'TaxIncentive', 'General', 'Other') <-- MUST CHOOSE ONLY ONE.
    Policy Text: "{policy_content[:2000]}" 
    """
    try:
        response = ollama_client.chat(model='mistral', messages=[{'role': 'user', 'content': prompt}], format='json')
        features = json.loads(response['message']['content'])
        if 'policy_type' not in features or 'action_type' not in features:
            features = {'policy_type': 'ParseError', 'action_type': 'ParseError'}
        
        raw_action = features.get('action_type', 'Other')
        if isinstance(raw_action, list): clean_action = raw_action[0] if raw_action else 'Other'
        elif isinstance(raw_action, str): clean_action = raw_action.split(',')[0].strip()
        else: clean_action = 'Other'
        features['action_type'] = clean_action
        return features
    except Exception:
        return {'policy_type': 'Error', 'action_type': 'Error'}

def get_policy_embedding(policy_content: str) -> List[float]:
    # (Identical to the simulator's helper)
    if not ollama_client: return None
    try:
        response = ollama_client.embeddings(model=EMBEDDING_MODEL, prompt=policy_content)
        embedding = response.get('embedding')
        if embedding and len(embedding) == NUM_EMBEDDING_FEATURES:
            return embedding
        return None
    except Exception:
        return None

# --- 5. Define the API Endpoint (COMBINED Logic) ---

@router.get("/", response_model=RecommendationResponse)
async def get_recommendations(
    pollutant: str = Query(..., description="The specific pollutant to target, e.g., 'EDGAR_CO2'"),
    policy_year: int = Query(2025, description="The year to simulate for"),
    top_n: int = Query(5, description="The number of recommendations to return")
):
    """
    Ranks candidate policies using the V3 COMBINED model.
    """
    if not model_pipeline or df_candidates is None or not ollama_client:
        raise HTTPException(status_code=503, detail="Recommender is not loaded.")

    print(f"Generating features and embeddings for {len(df_candidates)} candidates...")
    
    # --- Step 1: Get ALL features for all candidates ---
    all_features = []
    for index, row in df_candidates.iterrows():
        text = row['policy_text']
        simple_features = get_policy_features_simple(text)
        embedding = get_policy_embedding(text)
        
        if embedding and simple_features['policy_type'] != 'Error':
            record = {
                'policy_name': row['policy_name'],
                'policy_text': text,
                'pollutant': pollutant,
                'policy_year': policy_year,
                'policy_type': simple_features['policy_type'],
                'action_type': simple_features['action_type'],
            }
            # Add the embedding
            record.update({f'embed_{i}': val for i, val in enumerate(embedding)})
            all_features.append(record)
        else:
            print(f"Skipping candidate: {row['policy_name']} (LLM Error)")

    if not all_features:
        raise HTTPException(status_code=500, detail="No valid policy candidates could be featurized.")

    # --- Step 2: Create the DataFrame for the model ---
    df_scenarios = pd.DataFrame.from_records(all_features)
    df_results = df_scenarios[['policy_name', 'policy_text', 'policy_type', 'action_type']].copy() # For the final result

    # --- Step 3: Get predictions ---
    try:
        # Ensure column order (from Script 11)
        cat_features = ['pollutant', 'policy_type', 'action_type']
        num_features = ['policy_year'] + [f'embed_{i}' for i in range(NUM_EMBEDDING_FEATURES)]
        df_scenarios_ordered = df_scenarios[cat_features + num_features]
    
        all_probabilities = model_pipeline.predict_proba(df_scenarios_ordered)
        all_predictions = model_pipeline.predict(df_scenarios_ordered)
        
        target_class_index = list(model_pipeline.classes_).index(OPTIMIZATION_TARGET_CLASS)
        
        df_results['confidence_in_good_impact'] = all_probabilities[:, target_class_index]
        df_results['predicted_class'] = all_predictions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    # --- Step 4: Sort and format results ---
    df_top_results = df_results.sort_values(by='confidence_in_good_impact', ascending=False).head(top_n)

    recommendations = [
        Recommendation(
            policy_name=row.policy_name,
            policy_text=row.policy_text,
            pollutant=pollutant,
            confidence_in_good_impact=row.confidence_in_good_impact,
            predicted_class=row.predicted_class,
            policy_type_debug=row.policy_type,
            action_type_debug=row.action_type
        )
        for index, row in df_top_results.iterrows()
    ]
    
    return RecommendationResponse(recommendations=recommendations)