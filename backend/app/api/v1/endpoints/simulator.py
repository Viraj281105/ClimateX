import os
import pandas as pd
import ollama
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict

# --- 1. Setup: Load Knowledge Base ---
try:
    FILE_DIR = Path(__file__).parent
    ROOT_DIR = FILE_DIR.parents[4] # 0=v1, 1=api, 2=app, 3=backend, 4=ClimateX
    
    # --- UPDATED: Load the featurized DB as our "Knowledge Base" ---
    DB_PATH = ROOT_DIR / "data" / "processed" / "india_policies_featurized_local.csv"
    
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Knowledge Base not found at: {DB_PATH}")

    # Load the 603 real policies into memory
    df_knowledge_base = pd.read_csv(DB_PATH)
    # Clean it just like we did for training
    df_knowledge_base = df_knowledge_base.dropna(subset=['Policy', 'Year', 'policy_type', 'action_type'])
    df_knowledge_base = df_knowledge_base[~df_knowledge_base['policy_type'].isin(['ParseError', 'Error'])]
    
    ollama_client = ollama.Client()
    ollama_client.list()
    
    print(f"✅ Causal Analogy Engine loaded with {len(df_knowledge_base)} policies from: {DB_PATH}")
    print(f"✅ Ollama client connected successfully.")

except Exception as e:
    print(f"❌ CRITICAL STARTUP ERROR: {e}")
    df_knowledge_base = None
    ollama_client = None

router = APIRouter()

# --- 2. Define API Input (Request) and Output (Response) ---

class PolicySimulationRequest(BaseModel):
    policy_text: str
    pollutant: str  # We'll keep this for future use, but the logic won't use it yet
    policy_year: int

class HistoricalAnalogy(BaseModel):
    policy_name: str
    year_enacted: int
    policy_type: str
    action_type: str

class PolicySimulationResponse(BaseModel):
    user_policy_type: str
    user_action_type: str
    historical_analogies_found: int
    analogies: List[HistoricalAnalogy]

# --- 3. Helper Function: Featurize Text with LLM ---

def get_policy_features(policy_content: str) -> Dict[str, str]:
    """
    Uses the 'mistral' LLM to get the simple features (policy_type, action_type).
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

# --- 4. Define the API Endpoint (NEW Knowledge Retrieval Logic) ---

@router.post("/simulate", response_model=PolicySimulationResponse)
async def simulate_policy_impact(request: PolicySimulationRequest):
    """
    Simulates the impact of a new policy by finding historical analogies.
    1. Featurizes the policy text using a local LLM.
    2. Searches the knowledge base for real policies with the same features.
    """
    if df_knowledge_base is None or ollama_client is None:
        raise HTTPException(status_code=503, detail="System is not loaded. Check server logs.")

    # Step 1: Featurize the user's policy text
    try:
        features = get_policy_features(request.policy_text)
        user_policy_type = features.get('policy_type')
        user_action_type = features.get('action_type')
    except HTTPException as e:
        raise e

    # Step 2: Search the Knowledge Base (the DataFrame)
    matches = df_knowledge_base[
        (df_knowledge_base['policy_type'] == user_policy_type) &
        (df_knowledge_base['action_type'] == user_action_type)
    ]

    # Step 3: Format the results
    analogies = []
    if not matches.empty:
        # Sort by most recent first
        matches = matches.sort_values(by='Year', ascending=False)
        for _, row in matches.iterrows():
            analogies.append(HistoricalAnalogy(
                policy_name=row['Policy'],
                year_enacted=row['Year'],
                policy_type=row['policy_type'],
                action_type=row['action_type']
            ))

    # Step 4: Return the result
    return PolicySimulationResponse(
        user_policy_type=user_policy_type,
        user_action_type=user_action_type,
        historical_analogies_found=len(analogies),
        analogies=analogies
    )