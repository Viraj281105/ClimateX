import os
import joblib
import pandas as pd
import ollama
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict

# --- 1. Setup: Load COMBINED Model (V3) ---

try:
    FILE_DIR = Path(__file__).parent
    ROOT_DIR = FILE_DIR.parents[4] # 0=v1, 1=api, 2=app, 3=backend, 4=ClimateX
    
    # --- UPDATED ---
    # Loading the V3 COMBINED model (from Script 11)
    MODEL_PATH = ROOT_DIR / "model_artifacts" / "robust_simulator_pipeline_v3.joblib"
    
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at calculated path: {MODEL_PATH}")

    model_pipeline = joblib.load(MODEL_PATH)
    
    ollama_client = ollama.Client()
    EMBEDDING_MODEL = 'nomic-embed-text'
    
    ollama_client.list()
    print(f"✅ V3 COMBINED Model loaded from: {MODEL_PATH}")
    print(f"✅ Ollama client connected successfully (using '{EMBEDDING_MODEL}' and 'mistral').")

    NUM_EMBEDDING_FEATURES = 768

except Exception as e:
    print(f"❌ CRITICAL STARTUP ERROR: {e}")
    model_pipeline = None
    ollama_client = None

router = APIRouter()

# --- 2. Define API Input (Request) and Output (Response) ---

class PolicySimulationRequest(BaseModel):
    policy_text: str
    pollutant: str
    policy_year: int

class PolicySimulationResponse(BaseModel):
    predicted_class: str
    confidence_scores: Dict[str, float]
    # We'll also return the classified features for debugging
    policy_type_debug: str
    action_type_debug: str

# --- 3. Helper Functions (Two of them now) ---

def get_policy_features_simple(policy_content: str) -> Dict[str, str]:
    """
    Uses the 'mistral' LLM to get the *simple features* (policy_type, action_type).
    This version is robust and cleans the output.
    """
    if not ollama_client:
        raise HTTPException(status_code=503, detail="Ollama client (mistral) not available.")
        
    prompt = f"""
    You are an expert policy analyst. Classify the text.
    Your response MUST be a valid JSON object with "policy_type" and "action_type".
    1. "policy_type": (e.g., 'RenewableEnergy', 'EnergyEfficiency', 'Transport', 'Industrial', 'Framework', 'Other')
    2. "action_type": (e.g., 'Regulation', 'Standard', 'Investment', 'R&D', 'TaxIncentive', 'General', 'Other') <-- MUST CHOOSE ONLY ONE.
    Policy Text: "{policy_content[:2000]}" 
    """
    try:
        response = ollama_client.chat(
            model='mistral',
            messages=[{'role': 'user', 'content': prompt}],
            format='json'
        )
        features = json.loads(response['message']['content'])
        
        if 'policy_type' not in features or 'action_type' not in features:
            raise ValueError("LLM (mistral) did not return required keys.")
            
        # --- Robustness cleanup ---
        raw_action = features.get('action_type', 'Other')
        if isinstance(raw_action, list):
            clean_action = raw_action[0] if raw_action else 'Other'
        elif isinstance(raw_action, str):
            clean_action = raw_action.split(',')[0].strip()
        else:
            clean_action = 'Other'
            
        features['action_type'] = clean_action
        return features
        
    except Exception as e:
        print(f"❌ LLM Simple Feature Error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM (mistral) featurization failed: {e}")

def get_policy_embedding(policy_content: str) -> List[float]:
    """
    Uses the 'nomic-embed-text' LLM to get the text *embedding*.
    """
    if not ollama_client:
        raise HTTPException(status_code=503, detail="Ollama client (nomic) not available.")
    
    if pd.isna(policy_content) or not policy_content.strip():
        raise HTTPException(status_code=400, detail="Policy text cannot be empty.")
    try:
        response = ollama_client.embeddings(
            model=EMBEDDING_MODEL,
            prompt=policy_content
        )
        embedding = response.get('embedding')
        if not embedding or len(embedding) != NUM_EMBEDDING_FEATURES:
            raise ValueError(f"Embedding length mismatch. Expected {NUM_EMBEDDING_FEATURES}, Got {len(embedding)}")
        return embedding
    except Exception as e:
        print(f"❌ LLM Embedding Error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM (nomic) embedding failed: {e}")
    
# --- 4. Define the API Endpoint (COMBINED Logic) ---

@router.post("/simulate", response_model=PolicySimulationResponse)
async def simulate_policy_impact(request: PolicySimulationRequest):
    """
    Simulates the impact using the V3 COMBINED model.
    1. Gets simple features (policy_type) from LLM.
    2. Gets text embedding from LLM.
    3. Predicts impact.
    """
    if not model_pipeline:
        raise HTTPException(status_code=503, detail="Model V3 is not loaded.")

    try:
        # Step 1: Get simple features
        simple_features = get_policy_features_simple(request.policy_text)
        
        # Step 2: Get embedding
        embedding = get_policy_embedding(request.policy_text)
    except HTTPException as e:
        raise e

    # Step 3: Create the DataFrame for the model (must match Script 11)
    
    # Dict for embedding features
    embedding_features_dict = {f'embed_{i}': val for i, val in enumerate(embedding)}
    
    # Combined input record
    input_data_dict = {
        'pollutant': [request.pollutant],
        'policy_type': [simple_features['policy_type']],
        'action_type': [simple_features['action_type']],
        'policy_year': [request.policy_year],
        **embedding_features_dict
    }
    
    input_data = pd.DataFrame.from_dict(input_data_dict)
    
    # Ensure column order (from Script 11)
    try:
        cat_features = ['pollutant', 'policy_type', 'action_type']
        num_features = ['policy_year'] + [f'embed_{i}' for i in range(NUM_EMBEDDING_FEATURES)]
        
        input_data = input_data[cat_features + num_features]
    except KeyError as e:
        raise HTTPException(status_code=500, detail=f"Feature mismatch error: {e}")

    # Step 4: Get prediction
    try:
        predicted_class = model_pipeline.predict(input_data)[0]
        probabilities = model_pipeline.predict_proba(input_data)[0]
        class_labels = model_pipeline.classes_
        confidence_scores = {label: prob for label, prob in zip(class_labels, probabilities)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    # Step 5: Return the result
    return PolicySimulationResponse(
        predicted_class=predicted_class,
        confidence_scores=confidence_scores,
        policy_type_debug=simple_features['policy_type'],
        action_type_debug=simple_features['action_type']
    )