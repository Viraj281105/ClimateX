import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict

# --- 1. Setup: Load Candidate Policies ---
try:
    FILE_DIR = Path(__file__).parent
    ROOT_DIR = FILE_DIR.parents[4] # 0=v1, 1=api, 2=app, 3=backend, 4=ClimateX
    
    CANDIDATES_PATH = ROOT_DIR / "data" / "processed" / "recommendation_candidates.csv"
    
    if not CANDIDATES_PATH.exists():
        raise FileNotFoundError(f"Candidates file not found at: {CANDIDATES_PATH}")

    df_candidates = pd.read_csv(CANDIDATES_PATH)
    print(f"✅ Recommender loaded {len(df_candidates)} candidates from: {CANDIDATES_PATH}")

except Exception as e:
    print(f"❌ CRITICAL STARTUP ERROR (Recommender): {e}")
    df_candidates = None

# --- 2. Define "Expert Rules" ---
# This hard-coded dict maps pollutants to *categories* of policies
# We get these categories from our `recommendation_candidates.csv` file's "policy_name"
# This is a simple, robust "Expert System"
EXPERT_RULES = {
    # Greenhouse Gases
    "EDGAR_CO2": ["Solar", "Wind", "EV", "Geothermal", "Nuclear", "Carbon Tax", "Cap-and-Trade", "Forestry", "Soil", "Methane"],
    "EDGAR_CH4": ["Methane", "Agriculture", "Soil", "Landfill"],
    "EDGAR_N2O": ["Agriculture", "Soil", "Fertilizer"],
    
    # Air Pollutants
    "EDGAR_SO2": ["Industrial", "Scrubbers", "Shipping", "Fuel"],
    "EDGAR_NOx": ["Industrial", "Transport", "EV", "Shipping", "Bus"],
    "EDGAR_PM2": ["Industrial", "Transport", "Bus", "Building"],
    "EDGAR_CO_1970_2022": ["Industrial", "Transport", "EV", "Bus"], # Use the correct column name
    
    # Other
    "Water": ["Water", "Wetland", "Agriculture"],
    "Waste": ["Waste", "Plastic", "Circular Economy"]
}

router = APIRouter()

# --- 3. Define API Response ---
class Recommendation(BaseModel):
    policy_name: str
    policy_text: str

class RecommendationResponse(BaseModel):
    recommendations_for: str
    recommendations: List[Recommendation]

# --- 4. Define the API Endpoint (NEW Expert System Logic) ---

@router.get("/", response_model=RecommendationResponse)
async def get_recommendations(
    pollutant: str = Query(..., description="The specific pollutant to target, e.g., 'EDGAR_CO2'"),
    top_n: int = Query(5, description="The number of recommendations to return")
):
    """
    Recommends expert-vetted policies based on the target pollutant.
    """
    if df_candidates is None:
        raise HTTPException(status_code=503, detail="Recommender system is not loaded.")

    # Step 1: Find the expert-recommended keywords for this pollutant
    keywords = []
    # Find the rule that matches the start of the pollutant name
    for key, value in EXPERT_RULES.items():
        if pollutant.startswith(key):
            keywords = value
            break
    
    if not keywords:
        # Fallback: if no specific rule, recommend general policies
        keywords = ["Solar", "Industrial", "Framework", "Transport"]

    # Step 2: Search the candidate policies
    # Create a regex pattern (e.g., "Solar|Wind|EV")
    search_pattern = "|".join(keywords)
    
    # Find all rows in `df_candidates` where the name matches the pattern (case-insensitive)
    matches = df_candidates[
        df_candidates['policy_name'].str.contains(search_pattern, case=False)
    ]
    
    if matches.empty:
        # If no matches, just return the first N candidates as a fallback
        matches = df_candidates.head(top_n)

    # Step 3: Format and return the results
    recommendations = [
        Recommendation(
            policy_name=row.policy_name,
            policy_text=row.policy_text
        )
        for index, row in matches.head(top_n).iterrows()
    ]
    
    return RecommendationResponse(
        recommendations_for=pollutant,
        recommendations=recommendations
    )