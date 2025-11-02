import os
import pandas as pd
import ollama
import json
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict, Optional, Any
from enum import Enum 

# --- 1. Global Setup and Initialization ---
try:
    FILE_DIR = Path(__file__).parent
    ROOT_DIR = FILE_DIR.parents[4]
    CANDIDATES_PATH = ROOT_DIR / "data" / "processed" / "recommendation_candidates.csv"
    
    if not CANDIDATES_PATH.exists():
        raise FileNotFoundError(f"Candidates file not found at: {CANDIDATES_PATH}")
    df_candidates = pd.read_csv(CANDIDATES_PATH)
    
    ollama_client = ollama.Client()
    ollama_client.list()
    
    print(f"✅ Recommender loaded {len(df_candidates)} candidates.")

except Exception as e:
    print(f"❌ CRITICAL STARTUP ERROR (Recommender): {e}")
    df_candidates = None
    ollama_client = None

# --- 2. Define Models and Expert Rules ---

# Define User-Friendly Pollutant Dropdown
class UserPollutant(str, Enum):
    CARBON_DIOXIDE = "Carbon Dioxide (CO2)"
    AIR_POLLUTION = "Air Pollution (PM/NOx)"
    GENERAL_POLLUTANTS = "General Pollutants (SO2)"

# Define the final Expert Rules using User-Friendly Keys
EXPERT_RULES = {
    UserPollutant.CARBON_DIOXIDE.value: ["Solar", "Wind", "EV", "Carbon Tax", "Cap-and-Trade", "Forestry", "Soil", "Methane"],
    UserPollutant.AIR_POLLUTION.value: ["Industrial", "Transport", "Bus", "Building"],
    UserPollutant.GENERAL_POLLUTANTS.value: ["Industrial", "Scrubbers", "Shipping", "Fuel", "Waste"]
}

# Define Output Models
class Recommendation(BaseModel):
    policy_name: str
    expert_brief: str # The quick 50-word brief

class RecommendationResponse(BaseModel):
    recommendations_for: str
    recommendations: List[Recommendation]
    
class PolicyDetailResponse(BaseModel):
    policy_name: str
    policy_text: str
    estimated_timeframe: str
    primary_mechanism: str
    long_impact_analysis: str

# --- 3. LLM HELPER FUNCTIONS (Moved to top for execution order) ---

def generate_policy_brief(policy_name: str, policy_text: str) -> str:
    """
    Uses the LLM to generate a brief, descriptive paragraph for a candidate policy.
    """
    if not ollama_client:
        return "System Error: LLM client is unavailable."

    prompt = f"""
    You are a policy advisor. Based on the name '{policy_name}' and this text: '{policy_text}', 
    write a single, brief, 50-word description highlighting the policy's primary goal and mechanism (e.g., Regulation, Investment).
    """

    try:
        response = ollama_client.generate(
            model='mistral',
            prompt=prompt
        )
        return response['response'].strip()
    except Exception:
        return f"LLM Generation Error: Could not generate brief for {policy_name}."


def generate_detailed_analysis(policy_name: str, policy_text: str) -> Dict[str, str]:
    """
    Uses the LLM to generate a full, structured analysis for the 'Read More' popup.
    """
    if not ollama_client:
        return {
            'timeframe': "Unavailable",
            'mechanism': "Unavailable",
            'analysis': "System Error: LLM client is unavailable."
        }

    prompt = f"""
    You are a Strategic Policy Consultant. Analyze the following policy and provide a structured impact assessment.
    Policy Name: {policy_name}
    Policy Text: {policy_text}

    Generate the output as a single, coherent narrative that strictly adheres to the following three sections. Be descriptive and analytical.
    
    SECTION A: Policy Mechanism & Focus (1-2 sentences)
    Identify the primary *mechanism* (Regulation, Investment, Market-Based) and the *sector* of focus.
    
    SECTION B: Estimated Timeframe and Impact (3-5 sentences)
    Estimate the realistic timeframe (e.g., 5-10 years) needed to see *significant*, measurable effects. Describe the major environmental and economic benefits expected at that point.
    
    SECTION C: Implementation Risks and Mitigations (3-5 sentences)
    Identify the top 2-3 risks (e.g., grid resistance, high capital costs, legislative difficulty) and suggest proactive mitigation strategies.
    """

    try:
        response = ollama_client.generate(model='mistral', prompt=prompt)
        analysis_text = response['response'].strip()
        
        # Simple extraction of Timeframe and Mechanism
        mechanism_match = next((m for m in ['Regulation', 'Investment', 'Market-Based', 'R&D', 'Incentive'] if m in analysis_text), 'General/Mixed')
        timeframe_match = next((t for t in ['3-5 years', '5-10 years', '10-15 years', 'Beyond 15 years'] if t in analysis_text), '5-10 years')
        
        return {
            'timeframe': timeframe_match,
            'mechanism': mechanism_match,
            'analysis': analysis_text
        }
    except Exception as e:
        return {'timeframe': 'Error', 'mechanism': 'Error', 'analysis': f"LLM Generation Error: {e}"}


# --- 4. Define API Router and Endpoints ---

router = APIRouter() # FIX: Router is now defined before use

# Endpoint 1: Returns the fast, initial list for cards
@router.get("/", response_model=RecommendationResponse)
async def get_recommendations(
    pollutant: UserPollutant = Query(..., description="The pollutant type selected from the dropdown."),
    top_n: int = Query(5, description="Number of recommendations to return (Hardcoded to 10 for UI).")
):
    """
    Returns the initial list of top 10 recommended policy titles and quick briefs.
    """
    if df_candidates is None or ollama_client is None:
        raise HTTPException(status_code=503, detail="Recommender is not loaded.")

    # Use the selected pollutant value (str) as the key
    pollutant_key = pollutant.value
    keywords = EXPERT_RULES.get(pollutant_key, ["Solar", "Framework"])
    
    search_pattern = "|".join(keywords)
    
    matches = df_candidates[
        df_candidates['policy_name'].str.contains(search_pattern, case=False)
    ].copy()

    if matches.empty: matches = df_candidates.head(top_n).copy()

    recommendations = []
    # Force top_n=10 for the UI list
    for index, row in matches.head(10).iterrows():
        # CALL: generate_policy_brief is now defined, so this works
        brief = generate_policy_brief(row.policy_name, row.policy_text) 
        
        recommendations.append(
            Recommendation(
                policy_name=row.policy_name,
                expert_brief=brief
            )
        )
    
    return RecommendationResponse(
        recommendations_for=pollutant_key,
        recommendations=recommendations
    )


# Endpoint 2: Returns the detailed analysis for the "Read More" popup
@router.get("/detail", response_model=PolicyDetailResponse)
async def get_policy_detail(
    policy_name: str = Query(..., description="The exact name of the policy to analyze.")
):
    """
    Generates a detailed, structured analysis for a single policy (for the 'Read More' popup).
    """
    if df_candidates is None or ollama_client is None:
        raise HTTPException(status_code=503, detail="Recommender is not loaded.")

    policy_row = df_candidates[df_candidates['policy_name'] == policy_name]
    
    if policy_row.empty:
        raise HTTPException(status_code=404, detail="Policy not found in candidate list.")
    
    policy_text = policy_row['policy_text'].iloc[0]
    
    # CALL: Generate the intensive, structured analysis using the LLM
    analysis_results = generate_detailed_analysis(policy_name, policy_text)
    
    # Return the structured response
    return PolicyDetailResponse(
        policy_name=policy_name,
        policy_text=policy_text,
        estimated_timeframe=analysis_results['timeframe'],
        primary_mechanism=analysis_results['mechanism'],
        long_impact_analysis=analysis_results['analysis']
    )