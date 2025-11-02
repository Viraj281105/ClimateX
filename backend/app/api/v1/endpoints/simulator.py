import os
import pandas as pd
import ollama
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict

# --- 1. Setup: Load Knowledge Base and Ollama Client ---
try:
    FILE_DIR = Path(__file__).parent
    ROOT_DIR = FILE_DIR.parents[4] # Navigates to the project root
    
    # Load the featurized DB as our "Knowledge Base"
    DB_PATH = ROOT_DIR / "data" / "processed" / "india_policies_featurized_local.csv"
    
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Knowledge Base not found at: {DB_PATH}")

    df_knowledge_base = pd.read_csv(DB_PATH)
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
    pollutant: str
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
    generated_impact_summary: str # <-- NEW FIELD for the executive brief

# --- 3. Helper Functions: LLM Featurization and Summary Generation ---

def get_policy_features(policy_content: str) -> Dict[str, str]:
    """Uses LLM (mistral) to classify the policy text."""
    if not ollama_client:
        raise HTTPException(status_code=503, detail="Ollama client (mistral) not available.")
        
    prompt = f"""
    You are an expert climate policy analyst. Classify the text.
    Your response MUST be a valid JSON object with "policy_type" and "action_type".
    1. "policy_type": (e.g., 'RenewableEnergy', 'EnergyEfficiency', 'Transport', 'Industrial', 'Framework', 'Other')
    2. "action_type": (e.g., 'Regulation', 'Standard', 'Investment', 'R&D', 'TaxIncentive', 'General', 'Other') <-- MUST CHOOSE ONLY ONE.
    Policy Text: "{policy_content[:2000]}" 
    """
    try:
        response = ollama_client.chat(model='mistral', messages=[{'role': 'user', 'content': prompt}], format='json')
        features = json.loads(response['message']['content'])
        
        # Robustness cleanup
        raw_action = features.get('action_type', 'Other')
        if isinstance(raw_action, str):
            clean_action = raw_action.split(',')[0].strip()
        else:
            clean_action = 'Other'
            
        features['action_type'] = clean_action
        return features
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM (mistral) featurization failed: {e}")


def generate_impact_summary(policy_type: str, action_type: str, analogies: List[Dict]) -> str:
    """
    Uses the LLM to generate a structured, detailed impact summary (approx. 250 words).
    """
    if not ollama_client:
        return "System Error: LLM client is unavailable."

    analogy_text = "\n".join([
        f"- {a['policy_name']} ({a['year_enacted']})" for a in analogies
    ])
    
    if not analogy_text:
        analogy_text = "No direct historical analogies were found for this specific combination of Policy Type and Action Type."

    prompt = f"""
    You are an expert climate policy analyst writing a detailed executive summary for a government cabinet.
    
    The user is proposing a new policy classified as:
    - Policy Type: {policy_type}
    - Action Type: {action_type}
    
    The historical record shows these similar policies were implemented in the past (use these for context on challenges and typical results):
    {analogy_text}
    
    Your summary MUST be a single, detailed narrative paragraph (approximately 250 words total) structured with clear section headers for clarity. Synthesize the expected outcomes based on the successful historical precedence of this policy type.

    ---
    
    SECTION 1: Expected Impact & Strategic Value
    Describe the typical primary environmental and economic benefits. Focus on the strategic alignment with national goals (e.g., energy security, global leadership).
    
    SECTION 2: Implementation Challenges
    Analyze the common historical difficulties faced by similar policies (e.g., grid issues, financing risks, local opposition).
    
    SECTION 3: Recommended Next Steps
    Conclude with a clear, concise recommendation on how to maximize success based on the lessons learned from the historical record.
    
    ---
    
    Do NOT explicitly list the policies from the historical record in your final narrative.
    """

    try:
        # Use generate for simple text response
        response = ollama_client.generate(
            model='mistral',
            prompt=prompt
        )
        return response['response'].strip()
    except Exception as e:
        return f"LLM Generation Error: Could not generate summary. ({e})"


# --- 4. Define the API Endpoint (Knowledge Retrieval Logic) ---

@router.post("/simulate", response_model=PolicySimulationResponse)
async def simulate_policy_impact(request: PolicySimulationRequest):
    """
    Simulates the impact of a new policy by finding historical analogies and generating a summary.
    """
    if df_knowledge_base is None or ollama_client is None:
        raise HTTPException(status_code=503, detail="System is not loaded. Check server logs.")

    # Step 1: Featurize the user's policy text
    features = get_policy_features(request.policy_text)
    user_policy_type = features.get('policy_type')
    user_action_type = features.get('action_type')

    # Step 2: Search the Knowledge Base for matches
    matches = df_knowledge_base[
        (df_knowledge_base['policy_type'] == user_policy_type) &
        (df_knowledge_base['action_type'] == user_action_type)
    ]

    # Step 3: Format the results
    analogies = []
    if not matches.empty:
        # Limit to 5 analogies for the prompt context, sorted by most recent
        matches = matches.sort_values(by='Year', ascending=False).head(5) 
        for _, row in matches.iterrows():
            analogies.append(HistoricalAnalogy(
                policy_name=row['Policy'],
                year_enacted=row['Year'],
                policy_type=row['policy_type'],
                action_type=row['action_type']
            ))

    # Step 4: Generate the descriptive summary
    analogy_dicts = [a.dict() for a in analogies]
    impact_summary = generate_impact_summary(
        user_policy_type, 
        user_action_type, 
        analogy_dicts
    )

    # Step 5: Return the result
    return PolicySimulationResponse(
        user_policy_type=user_policy_type,
        user_action_type=user_action_type,
        historical_analogies_found=len(matches),
        analogies=analogies,
        generated_impact_summary=impact_summary # <-- The new valuable output
    )