import os
import pandas as pd
import ollama
import json
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict, Optional, Any
from enum import Enum

# --- Define User-Friendly Pollutant Mapping (NEW) ---
class UserPollutant(str, Enum):
    """Defines the selectable, user-friendly options for the frontend."""
    CARBON_DIOXIDE = "Carbon Dioxide (CO2)"
    AIR_POLLUTION = "Air Pollution (PM/NOx)"
    GENERAL = "General Pollutants (SO2)"

# --- Define the mapping from User Label to Technical Label ---
POLLUTANT_MAP = {
    UserPollutant.CARBON_DIOXIDE.value: "EDGAR_CO_1970_2022", # Closest CO2 proxy in your data
    UserPollutant.AIR_POLLUTION.value: "EDGAR_PM2", 
    UserPollutant.GENERAL.value: "EDGAR_SO2_1970_2022"
}
# -----------------------------------------------------------

# --- 1. Setup: Load Knowledge Base and Ollama Client (No Functional Change) ---
try:
    FILE_DIR = Path(__file__).parent
    # This path might need adjustment. It assumes this file is 5 levels deep from the root.
    # e.g., /ClimateX/backend/app/api/v1/endpoints/simulator.py
    # If your structure is different, you may need ROOT_DIR = FILE_DIR.parents[3] or similar
    ROOT_DIR = FILE_DIR.parents[4] 
    DB_PATH = ROOT_DIR / "data" / "processed" / "india_policies_featurized_local.csv"
    
    df_knowledge_base = pd.read_csv(DB_PATH)
    df_knowledge_base = df_knowledge_base.dropna(subset=['Policy', 'Year', 'policy_type', 'action_type'])
    df_knowledge_base = df_knowledge_base[~df_knowledge_base['policy_type'].isin(['ParseError', 'Error'])]
    
    ollama_client = ollama.Client()
    ollama_client.list() # Test connection
    
except Exception as e:
    print(f"--- CRITICAL SERVER STARTUP ERROR ---")
    print(f"Error: {e}")
    print(f"Could not load dependencies. DB_PATH was: {DB_PATH}")
    df_knowledge_base = None
    ollama_client = None

router = APIRouter()

# --- 2. Define API Output (No Change) ---

class HistoricalAnalogy(BaseModel):
    policy_name: str
    year_enacted: int

class PolicySimulationResponse(BaseModel):
    generated_impact_summary: str
    user_policy_type: str
    user_action_type: str
    target_pollutants: List[str] # <-- Updated to reflect List of targets
    historical_analogies_found: int
    analogies: List[HistoricalAnalogy]

# --- 3. Helper Functions (FIXED) ---

def get_policy_features(policy_content: str) -> Dict[str, str]:
    """
    Uses Ollama (mistral) to classify the policy text into its 'policy_type'
    and 'action_type' and returns them as a JSON object.
    """
    if not ollama_client:
        return {"policy_type": "Error", "action_type": "LLM client not available"}

    # A specialized prompt to force the LLM to classify the text.
    prompt = f"""
    You are a policy classification engine. Your sole purpose is to analyze a policy text
    and classify it into a 'policy_type' and an 'action_type' from the provided lists.
    Return ONLY a valid JSON object with the two keys.

    Policy Text to Analyze:
    "{policy_content}"

    ---
    Categories:
    - policy_type: [Renewable Energy, Industrial Regulation, Transportation, Agriculture, Waste Management, Forestry, Market Mechanism, Public Awareness]
    - action_type: [Subsidies, Ban, Regulation, Investment, R&D, Tax, Public Campaign]
    ---

    Return your classification as a single JSON object, like this:
    {{"policy_type": "...", "action_type": "..."}}
    """

    try:
        response = ollama_client.generate(
            model='mistral',
            prompt=prompt,
            format='json' # Ask for JSON output
        )
        
        # The response['response'] will be a JSON *string*, e.g., '{"policy_type": "..."}'
        result_json = response['response'].strip()
        
        # Parse the JSON string into a Python dictionary
        result_dict = json.loads(result_json)
        
        # Basic validation
        if 'policy_type' in result_dict and 'action_type' in result_dict:
            return result_dict
        else:
            # The LLM returned JSON, but with the wrong keys
            return {"policy_type": "ParseError", "action_type": "Invalid JSON keys"}

    except json.JSONDecodeError:
        # The LLM's response was not a valid JSON string
        return {"policy_type": "ParseError", "action_type": "LLM did not return valid JSON"}
    except Exception as e:
        # Any other error (e.g., Ollama connection)
        return {"policy_type": "Error", "action_type": str(e)}

def generate_impact_summary(policy_type: str, action_type: str, target_pollutants: List[str], analogies: List[Dict]) -> str:
    """Updated to include the list of pollutants in the prompt."""
    if not ollama_client:
        return "System Error: LLM client is unavailable."

    analogy_text = "\n".join([
        f"- {a['policy_name']} ({a['year_enacted']})" for a in analogies
    ])
    
    if not analogy_text:
        analogy_text = "No direct historical analogies were found for this specific combination."

    # REFINED PROMPT: Includes the target pollutants in the synthesis instruction
    prompt = f"""
    You are an expert climate policy analyst writing a detailed executive summary for a government cabinet.
    
    The user is proposing a policy classified as:
    - Policy Type: {policy_type}
    - Action Type: {action_type}
    - Target Pollutants: {', '.join(target_pollutants)}
    
    The historical record shows these similar policies were implemented in the past (use these for context):
    {analogy_text}
    
    Write a single, detailed narrative paragraph (approximately 250 words total) structured with clear section headers. Synthesize the expected outcomes, focusing specifically on the **dual impact** on the identified Target Pollutants.

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
        response = ollama_client.generate(
            model='mistral',
            prompt=prompt
        )
        return response['response'].strip()
    except Exception as e:
        return f"LLM Generation Error: Could not generate summary. ({e})"


# --- 4. Define the API Endpoint (Final Logic) ---

@router.post("/simulate", response_model=PolicySimulationResponse)
async def simulate_policy_impact(
    # INPUT 1: Raw text from the request body
    policy_text: str = Body(..., media_type='text/plain', description="The raw text of the user's proposed policy."),
    # INPUT 2: Contextual parameters from the URL query string (NEW)
    target_pollutants: List[UserPollutant] = Query(
        [UserPollutant.CARBON_DIOXIDE], # Default selection
        description="The specific environmental targets (select one or more)."
    ),
    policy_year: int = Query(2025, description="The year the policy is proposed for enactment.")
):
    """
    Simulates the impact of a new policy by finding historical analogies and generating a summary.
    """
    if df_knowledge_base is None or ollama_client is None:
        raise HTTPException(status_code=503, detail="System is not loaded. Check server logs.")

    # Convert user-friendly labels to technical labels for the LLM prompt
    technical_targets = [POLLUTANT_MAP[p.value] for p in target_pollutants]

    # Step 1: Featurize the user's policy text (This will now work)
    features = get_policy_features(policy_text)
    user_policy_type = features.get('policy_type')
    user_action_type = features.get('action_type')

    # Step 2: Search the Knowledge Base for matches
    matches = df_knowledge_base[
        (df_knowledge_base['policy_type'] == user_policy_type) &
        (df_knowledge_base['action_type'] == user_action_type)
    ]

    # Step 3: Format the results
    analogies = []
    analogy_dicts = []
    if not matches.empty:
        matches = matches.sort_values(by='Year', ascending=False).head(5) 
        for _, row in matches.iterrows():
            analogy_data = {
                'policy_name': row['Policy'],
                'year_enacted': row['Year'],
                'policy_type': row['policy_type'],
                'action_type': row['action_type']
            }
            analogies.append(HistoricalAnalogy(
                policy_name=row['Policy'],
                year_enacted=row['Year']
            ))
            analogy_dicts.append(analogy_data)

    # Step 4: Generate the descriptive summary
    impact_summary = generate_impact_summary(
        user_policy_type, 
        user_action_type, 
        [p.value for p in target_pollutants], # Pass user-friendly names to LLM
        analogy_dicts
    )

    # Step 5: Return the refined result
    return PolicySimulationResponse(
        generated_impact_summary=impact_summary,
        user_policy_type=user_policy_type,
        user_action_type=user_action_type,
        target_pollutants=[p.value for p in target_pollutants], # Return user-friendly names
        historical_analogies_found=len(matches),
        analogies=analogies
    )