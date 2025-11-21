import os
import pandas as pd
import ollama
import json
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict
from enum import Enum
import re

# --- Define User-Friendly Pollutant Mapping (UNCHANGED) ---
class UserPollutant(str, Enum):
    CARBON_DIOXIDE = "Carbon Dioxide (CO2)"
    AIR_POLLUTION = "Air Pollution (PM/NOx)"
    GENERAL = "General Pollutants (SO2)"

POLLUTANT_MAP = {
    UserPollutant.CARBON_DIOXIDE.value: "EDGAR_CO_1970_2022",
    UserPollutant.AIR_POLLUTION.value: "EDGAR_PM2",
    UserPollutant.GENERAL.value: "EDGAR_SO2_1970_2022"
}

# -----------------------------------------------------------
# Loading KB + LLM
# -----------------------------------------------------------

try:
    FILE_DIR = Path(__file__).parent
    ROOT_DIR = FILE_DIR.parents[4]
    DB_PATH = ROOT_DIR / "data" / "processed" / "india_policies_featurized_local.csv"

    df_knowledge_base = pd.read_csv(DB_PATH)
    df_knowledge_base = df_knowledge_base.dropna(subset=['Policy', 'Year', 'policy_type', 'action_type'])
    df_knowledge_base = df_knowledge_base[~df_knowledge_base['policy_type'].isin(['ParseError', 'Error'])]

    ollama_client = ollama.Client()
    ollama_client.list()

except Exception as e:
    print(f"--- CRITICAL SERVER STARTUP ERROR ---")
    print(f"Error: {e}")
    print(f"Could not load dependencies. DB_PATH was: {DB_PATH}")
    df_knowledge_base = None
    ollama_client = None

router = APIRouter()

# -----------------------------------------------------------
# Response Models
# -----------------------------------------------------------

class HistoricalAnalogy(BaseModel):
    policy_name: str
    year_enacted: int

class PolicySimulationResponse(BaseModel):
    generated_impact_summary: str
    user_policy_type: str
    user_action_type: str
    target_pollutants: List[str]
    historical_analogies_found: int
    analogies: List[HistoricalAnalogy]

# -----------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------

def get_policy_features(policy_content: str) -> Dict[str, str]:
    if not ollama_client:
        return {"policy_type": "Error", "action_type": "LLM client not available"}

    prompt = f"""
    You are a policy classification engine. Analyze the policy text
    and classify it into a 'policy_type' and an 'action_type' from the lists.

    Policy Text:
    "{policy_content}"

    Categories:
    - policy_type: [Renewable Energy, Industrial Regulation, Transportation, Agriculture, Waste Management, Forestry, Market Mechanism, Public Awareness]
    - action_type: [Subsidies, Ban, Regulation, Investment, R&D, Tax, Public Campaign]

    Return ONLY JSON: {{"policy_type": "...", "action_type": "..." }}
    """

    try:
        response = ollama_client.generate(
            model='mistral',
            prompt=prompt,
            format='json'
        )

        result_json = response['response'].strip()
        result_dict = json.loads(result_json)

        if 'policy_type' in result_dict and 'action_type' in result_dict:
            return result_dict
        else:
            return {"policy_type": "ParseError", "action_type": "Invalid JSON keys"}

    except json.JSONDecodeError:
        return {"policy_type": "ParseError", "action_type": "LLM did not return valid JSON"}
    except Exception as e:
        return {"policy_type": "Error", "action_type": str(e)}

def generate_impact_summary(policy_type, action_type, target_pollutants, analogies):
    if not ollama_client:
        return "System Error: LLM unavailable."

    analogy_text = "\n".join([
        f"- {a['policy_name']} ({a['year_enacted']})" for a in analogies
    ]) or "No direct historical analogies were found for this combination."

    prompt = f"""
    You are an environmental policy analyst advising the Government of India.

    Write a **detailed, evidence-based policy impact brief** using the historical analogies provided.
    Ground your explanation specifically in **Indian regulatory history, Indian transport patterns,
    and India’s pollution challenges (PM2.5, PM10, NOx)**.

    Proposed Policy:
    - Policy Type: {policy_type}
    - Action Type: {action_type}
    - Target Pollutants: {', '.join(target_pollutants)}

    Relevant Historical Analogies From India (use these to extract patterns, NOT list them):
    {analogy_text}

    Your task:
    Write a **single, unified 250–300 word analysis** with the following sections:

    1. Expected Impact & Strategic Value for India
    - Explain how this policy would affect PM/NOx trends in Indian cities.
    - Reference historical successes or patterns from similar Indian policies.
    - Discuss public health impacts and alignment with national missions (NCAP, NEMMP, BS-VI, etc.)

    2. Implementation Challenges (India-Specific)
    - Discuss enforcement difficulty, compliance gaps, fuel quality issues,
        manufacturer readiness, consumer resistance, or infrastructure gaps.
    - Use insights drawn from the historical analogies.

    3. Recommended Next Steps (Actionable)
    - Give concrete, India-specific steps based on what worked or failed historically.
    - Include regulatory, industrial, and behavioral recommendations.

    IMPORTANT:
    Do NOT explicitly name or list the analogy policies.
    Do NOT include bullet lists of the given analogies.
    Do NOT output fewer than 230 words or more than 330 words.
    """


    try:
        response = ollama_client.generate(model='mistral', prompt=prompt)
        return response['response'].strip()
    except Exception as e:
        return f"LLM Generation Error: {e}"


# -----------------------------------------------------------
# FUZZY MATCHING (NEW)
# -----------------------------------------------------------

def fuzzy_contains(a, b):
    """Case-insensitive fuzzy match using first 4 characters."""
    if not isinstance(a, str) or not isinstance(b, str):
        return False
    if len(b) < 3:
        return False
    return re.search(re.escape(b[:4]), a, re.IGNORECASE) is not None


# -----------------------------------------------------------
# Main Endpoint
# -----------------------------------------------------------

@router.post("/simulate", response_model=PolicySimulationResponse)
async def simulate_policy_impact(
    policy_text: str = Body(..., media_type='text/plain'),
    target_pollutants: List[str] = Query(["Air Pollution (PM/NOx)"]),
    policy_year: int = Query(2025)
):
    if df_knowledge_base is None or ollama_client is None:
        raise HTTPException(status_code=503, detail="System not loaded. Check logs.")

    # --- Normalize pollutant input ---
    if isinstance(target_pollutants, list):
        combined = " ".join([str(x) for x in target_pollutants]).strip()
        target_pollutants = [combined]

    # Convert to technical labels if available
    technical_targets = []
    for p in target_pollutants:
        mapped = POLLUTANT_MAP.get(p, None)
        technical_targets.append(mapped if mapped else p)

    # --- LLM Classification ---
    features = get_policy_features(policy_text)
    user_policy_type = features.get('policy_type')
    user_action_type = features.get('action_type')

    # Normalize
    if isinstance(user_policy_type, list):
        user_policy_type = " ".join(user_policy_type).strip()
    if isinstance(user_action_type, list):
        user_action_type = " ".join(user_action_type).strip()

    # --- FUZZY MATCHING ---
    df_filtered = df_knowledge_base[
        df_knowledge_base['policy_type'].apply(lambda x: fuzzy_contains(str(x), user_policy_type)) &
        df_knowledge_base['action_type'].apply(lambda x: fuzzy_contains(str(x), user_action_type))
    ]

    matches = df_filtered.copy()

    # --- Build Analogies ---
    analogies = []
    analogy_dicts = []
    if not matches.empty:
        matches = matches.sort_values(by='Year', ascending=False).head(5)
        for _, row in matches.iterrows():
            analogies.append(HistoricalAnalogy(
                policy_name=row['Policy'],
                year_enacted=row['Year']
            ))
            analogy_dicts.append({
                "policy_name": row['Policy'],
                "year_enacted": row['Year'],
                "policy_type": row['policy_type'],
                "action_type": row['action_type']
            })

    # --- LLM Summary ---
    summary = generate_impact_summary(
        user_policy_type,
        user_action_type,
        target_pollutants,
        analogy_dicts
    )

    # --- Final Response ---
    return PolicySimulationResponse(
        generated_impact_summary=summary,
        user_policy_type=user_policy_type,
        user_action_type=user_action_type,
        target_pollutants=target_pollutants,
        historical_analogies_found=len(matches),
        analogies=analogies
    )
