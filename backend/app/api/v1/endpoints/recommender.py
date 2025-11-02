import os
import pandas as pd
import ollama
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict

# --- 1. Setup: Load Candidate Policies and Ollama Client ---
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
    print(f"✅ Ollama client connected successfully.")

except Exception as e:
    print(f"❌ CRITICAL STARTUP ERROR (Recommender): {e}")
    df_candidates = None
    ollama_client = None

# --- 2. Define "Expert Rules" ---
EXPERT_RULES = {
    "EDGAR_CO2": ["Solar", "Wind", "EV", "Geothermal", "Nuclear", "Carbon Tax", "Cap-and-Trade", "Forestry", "Soil", "Methane"],
    "EDGAR_SO2": ["Industrial", "Scrubbers", "Shipping", "Fuel"],
    "EDGAR_PM2": ["Industrial", "Transport", "Bus", "Building"],
    "Water": ["Water", "Wetland", "Agriculture"],
    "Waste": ["Waste", "Plastic", "Circular Economy"]
}

router = APIRouter()

# --- 3. Define API Response ---
class Recommendation(BaseModel):
    policy_name: str
    policy_text: str
    expert_brief: str # <-- NEW FIELD

class RecommendationResponse(BaseModel):
    recommendations_for: str
    recommendations: List[Recommendation]


# --- 4. Helper Function: Generate Policy Brief ---

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


# --- 5. Define the API Endpoint (Expert System Logic) ---

@router.get("/", response_model=RecommendationResponse)
async def get_recommendations(
    pollutant: str = Query(..., description="The specific pollutant to target, e.g., 'EDGAR_CO2'"),
    top_n: int = Query(5, description="The number of recommendations to return")
):
    """
    Recommends expert-vetted policies based on the target pollutant and generates a brief summary for each.
    """
    if df_candidates is None:
        raise HTTPException(status_code=503, detail="Recommender system is not loaded.")

    # Step 1: Find the expert-recommended keywords
    keywords = []
    for key, value in EXPERT_RULES.items():
        if pollutant.startswith(key):
            keywords = value
            break
    
    if not keywords:
        keywords = ["Solar", "Industrial", "Framework", "Transport"] # Default fallback

    # Step 2: Search the candidate policies
    search_pattern = "|".join(keywords)
    
    matches = df_candidates[
        df_candidates['policy_name'].str.contains(search_pattern, case=False)
    ]
    
    if matches.empty:
        matches = df_candidates.head(top_n)

    # Step 3: Format, Generate Brief, and return the results
    recommendations = []
    for index, row in matches.head(top_n).iterrows():
        brief = generate_policy_brief(row.policy_name, row.policy_text)
        
        recommendations.append(
            Recommendation(
                policy_name=row.policy_name,
                policy_text=row.policy_text,
                expert_brief=brief # <-- The new descriptive text
            )
        )
    
    return RecommendationResponse(
        recommendations_for=pollutant,
        recommendations=recommendations
    )