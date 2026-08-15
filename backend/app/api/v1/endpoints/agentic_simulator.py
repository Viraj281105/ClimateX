import ollama
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

# -----------------------------------------------------------
# Setup Ollama Client
# -----------------------------------------------------------
try:
    ollama_client = ollama.Client()
    ollama_client.list()
except Exception:
    ollama_client = None

# -----------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------
class AgenticSimulationRequest(BaseModel):
    policy_text: str

class StakeholderResponse(BaseModel):
    name: str
    role: str
    sentiment: str  # "Supportive", "Opposed", "Neutral", "Critical"
    satisfaction_index: float  # 0.0 to 10.0
    statement: str  # Custom verbal feedback statement

class YearTrajectoryPoint(BaseModel):
    year: int
    compliance_rate: float  # %
    economic_impact: float  # Cost metric
    emissions_reduction: float  # %
    stakeholders: List[StakeholderResponse]

class AgenticSimulationResponse(BaseModel):
    policy: str
    policy_type: str
    action_type: str
    trajectory: List[YearTrajectoryPoint]

# -----------------------------------------------------------
# Helper LLM / Static Agent Generator
# -----------------------------------------------------------
def generate_agent_statement(role: str, policy: str, year: int, satisfaction: float) -> str:
    """
    Generates a realistic statement from the perspective of the stakeholder.
    Uses Ollama if available, otherwise falls back to a template.
    """
    if ollama_client:
        prompt = f"""
        You are simulating a stakeholder reacting to a government policy.
        Stakeholder Role: {role}
        Policy Proposed: "{policy}"
        Current Year of Implementation: Year {year}
        Stakeholder Satisfaction Level: {satisfaction}/10

        Write a short, realistic, 1-2 sentence response statement in first person.
        Be contextually accurate to the Indian environment. Focus on immediate concerns like livelihoods, cost, enforcement, or health.
        Do NOT write introductory phrases or meta-text. Return only the quote.
        """
        try:
            res = ollama_client.generate(model='mistral', prompt=prompt)
            statement = res['response'].strip().strip('"')
            if len(statement) > 5:
                return statement
        except Exception:
            pass

    # Fallbacks if Ollama is not available or fails
    fallbacks = {
        "Municipal Commissioner": [
            "We are setting up baseline enforcement structures, but municipal funding constraints are an immediate hurdle.",
            "Enforcement has improved to 65% with new automated checking, though inter-agency coordination is still lagging.",
            "Compliance is now stabilized. We are seeing a steady decrease in pollution levels, which justifies the regulatory efforts."
        ],
        "Agrarian Farmer": [
            "Subsidies are announced but we haven't received them in our bank accounts. Input costs are rising.",
            "Alternative technologies are too expensive for small-scale farmers. We need direct cash transfers, not just tax breaks.",
            "We have started adopting solar water pumps because grid electricity was unreliable anyway. It's working out."
        ],
        "Industrialist": [
            "This policy forces capital expenditure on clean upgrades when global demand is low. Margins will shrink.",
            "Compliance costs are hurting small and medium enterprises. We need compliance deadline extensions.",
            "We've completed the transition to green processes. The early costs were high, but now energy efficiency is yielding savings."
        ],
        "Environmental NGO Advocate": [
            "A step in the right direction, but the targets are far too lenient to address the public health emergency.",
            "Implementation is weak. On-ground verification shows multiple industries violating emissions norms with impunity.",
            "We are finally seeing blue skies and lower hospital admissions for respiratory illnesses. The policy must be expanded."
        ]
    }
    
    lst = fallbacks.get(role, ["We are observing the situation and adapting as necessary."])
    # Pick a statement depending on the year index (clamped)
    idx = min(year - 1, len(lst) - 1)
    return lst[idx]

# -----------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------
@router.post("/simulate-timeline", response_model=AgenticSimulationResponse)
async def simulate_agentic_timeline(
    request: AgenticSimulationRequest,
    policy_type: str = Query("Renewable Energy"),
    action_type: str = Query("Subsidies")
):
    """
    Runs a multi-agent simulation over 5 years, modelling how virtual Indian stakeholders
    respond to policy initiatives, generating compliance rates and qualitative feedback.
    """
    policy = request.policy_text
    # Define roles
    roles = [
        {"name": "Rajesh Kumar", "role": "Municipal Commissioner", "base_satisfaction": 6.5},
        {"name": "Sukhwinder Singh", "role": "Agrarian Farmer", "base_satisfaction": 5.0},
        {"name": "Vikram Shroff", "role": "Industrialist", "base_satisfaction": 4.5},
        {"name": "Dr. Sunita Rao", "role": "Environmental NGO Advocate", "base_satisfaction": 7.0}
    ]

    # Adjust base satisfaction based on policy & action type
    for role in roles:
        if "Ban" in action_type:
            if role["role"] == "Industrialist":
                role["base_satisfaction"] -= 2.0
            if role["role"] == "Agrarian Farmer":
                role["base_satisfaction"] -= 1.0
            if role["role"] == "Environmental NGO Advocate":
                role["base_satisfaction"] += 1.5
        elif "Subsidies" in action_type:
            if role["role"] == "Industrialist":
                role["base_satisfaction"] += 1.0
            if role["role"] == "Agrarian Farmer":
                role["base_satisfaction"] += 2.0

    trajectory = []
    # Project year-by-year over 5 years
    for y in range(1, 6):
        # Calculate rates dynamically with mathematical formulas
        compliance = min(98.0, float(round(30.0 + (y * 11.5) + (roles[0]["base_satisfaction"] * 2.5), 1)))
        eco_burden = float(round(max(1.0, 8.5 - (y * 1.2) + (5.0 - roles[2]["base_satisfaction"]), 1)))
        emissions_red = float(round(min(45.0, (y * 6.5) * (1.2 if "Ban" in action_type else 1.0)), 1))

        stakeholder_responses = []
        for r in roles:
            # Satisfaction increases or stabilizes over time as adjustment happens
            sat = min(10.0, float(round(r["base_satisfaction"] + (y * 0.6), 1)))
            statement = generate_agent_statement(r["role"], policy, y, sat)
            
            sentiment = "Supportive" if sat >= 7.0 else ("Neutral" if sat >= 5.0 else "Critical")
            if "Ban" in action_type and r["role"] == "Industrialist" and y < 3:
                sentiment = "Opposed"

            stakeholder_responses.append(StakeholderResponse(
                name=r["name"],
                role=r["role"],
                sentiment=sentiment,
                satisfaction_index=sat,
                statement=statement
            ))

        trajectory.append(YearTrajectoryPoint(
            year=y,
            compliance_rate=compliance,
            economic_impact=eco_burden,
            emissions_reduction=emissions_red,
            stakeholders=stakeholder_responses
        ))

    return AgenticSimulationResponse(
        policy=policy,
        policy_type=policy_type,
        action_type=action_type,
        trajectory=trajectory
    )
