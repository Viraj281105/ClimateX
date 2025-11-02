import os
import joblib
import pandas as pd
import ollama
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path  # <-- Import Pathlib

# --- 1. Setup: Load Model and Define Paths ---

# Use pathlib for a robust path to the project root
# This file is in .../backend/app/api/v1/endpoints
# We need to go up 5 levels to get to the 'ClimateX' root
try:
    FILE_DIR = Path(__file__).parent  # This is the .../endpoints directory
    # 0=v1, 1=api, 2=app, 3=backend, 4=ClimateX
    ROOT_DIR = FILE_DIR.parents[4]
    MODEL_PATH = ROOT_DIR / "model_artifacts" / "robust_simulator_pipeline.joblib"
    
    # Ensure the path is correct
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at calculated path: {MODEL_PATH}")

    # Load the model and client at startup
    model_pipeline = joblib.load(MODEL_PATH)
    ollama_client = ollama.Client()
    # Test connection
    ollama_client.list()
    print(f"✅ Model loaded from: {MODEL_PATH}")
    print("✅ Ollama client connected successfully.")

except Exception as e:
    print(f"❌ CRITICAL STARTUP ERROR: {e}")
    model_pipeline = None
    ollama_client = None

router = APIRouter()

# --- 2. Define API Input (Request) and Output (Response) ---

class PolicySimulationRequest(BaseModel):
    policy_text: str
    pollutant: str  # e.g., "EDGAR_CO2"
    policy_year: int  # e.g., 2025

class PolicySimulationResponse(BaseModel):
    policy_type: str
    action_type: str
    predicted_class: str
    confidence_scores: dict

# --- 3. Helper Function: Featurize Text with LLM ---

# --- 3. Helper Function: Featurize Text with LLM ---

def get_policy_features(policy_content: str):
    """
    Uses the local Ollama model to classify policy text.
    THIS VERSION IS ROBUST: It validates and cleans the LLM output.
    """
    if not ollama_client:
        raise HTTPException(status_code=503, detail="Ollama client is not available.")
        
    prompt = f"""
    You are an expert policy analyst. Read the following policy text and classify it.
    
    Your response MUST be a valid JSON object with two keys:
    1. "policy_type": (e.g., 'RenewableEnergy', 'EnergyEfficiency', 'AirQualityStandard', 'Forestry', 'WaterManagement', 'Transport', 'Industrial', 'Framework', 'Agriculture', 'Other')
    2. "action_type": (e.g., 'Regulation', 'Standard', 'Investment', 'R&D', 'TaxIncentive', 'General', 'Other') <-- YOU MUST CHOOSE ONLY THE *ONE* BEST CATEGORY.

    Policy Text:
    "{policy_content[:2000]}" 
    """
    try:
        response = ollama_client.chat(
            model='mistral', # Assumes 'mistral' model
            messages=[{'role': 'user', 'content': prompt}],
            format='json'
        )
        features = json.loads(response['message']['content'])
        
        if 'policy_type' not in features or 'action_type' not in features:
            raise ValueError("LLM did not return the required keys.")
            
        # --- ROBUSTNESS FIX ---
        # The LLM sometimes returns "Investment, TaxIncentive".
        # We must clean this before sending it to the model.
        
        # 1. Get the raw action_type (it might be a list or a string)
        raw_action = features.get('action_type', 'Other')
        
        if isinstance(raw_action, list):
            # If it's a list, take the first item
            clean_action = raw_action[0] if raw_action else 'Other'
        elif isinstance(raw_action, str):
            # If it's a string, split by comma and take the first part
            clean_action = raw_action.split(',')[0].strip()
        else:
            clean_action = 'Other'
            
        # 2. Update the features dictionary with the clean, single value
        features['action_type'] = clean_action
        
        # --- END OF FIX ---
            
        return features
        
    except Exception as e:
        print(f"❌ LLM Featurization Error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM featurization failed: {e}")
    
# --- 4. Define the API Endpoint ---

@router.post("/simulate", response_model=PolicySimulationResponse)
async def simulate_policy_impact(request: PolicySimulationRequest):
    """
    Simulates the impact of a new, user-defined policy.
    1. Featurizes the policy text using a local LLM.
    2. Predicts the impact class using the robust classification model.
    """
    if not model_pipeline:
        raise HTTPException(status_code=503, detail="Model is not loaded. Check server logs.")

    # Step 1: Featurize the policy text
    try:
        features = get_policy_features(request.policy_text)
        policy_type = features.get('policy_type')
        action_type = features.get('action_type')
    except HTTPException as e:
        # Pass the HTTPException straight through
        raise e

    # Step 2: Create a DataFrame for the model
    input_data = pd.DataFrame({
        'pollutant': [request.pollutant],
        'policy_type': [policy_type],
        'action_type': [action_type],
        'policy_year': [request.policy_year]
    })

    # Step 3: Get predictions and probabilities
    try:
        # Get the predicted class (e.g., "Good Impact")
        predicted_class = model_pipeline.predict(input_data)[0]
        
        # Get the list of probabilities (e.g., [0.14, 0.81, 0.05])
        probabilities = model_pipeline.predict_proba(input_data)[0]
        
        # Match probabilities to their class names
        class_labels = model_pipeline.classes_
        confidence_scores = {label: prob for label, prob in zip(class_labels, probabilities)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    # Step 4: Return the result
    return PolicySimulationResponse(
        policy_type=policy_type,
        action_type=action_type,
        predicted_class=predicted_class,
        confidence_scores=confidence_scores
    )