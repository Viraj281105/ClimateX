from pydantic import BaseModel
from typing import List

# ------------------------------------------------------------
# INPUT MODEL — what frontend sends *if using the older API*
# ------------------------------------------------------------

class SimulationQuery(BaseModel):
    policy_type: str
    action_type: str


# ------------------------------------------------------------
# ANALOGY MODEL — a single matched historical policy
# ------------------------------------------------------------

class AnalogyResult(BaseModel):
    Policy: str
    policy_type: str
    action_type: str
    Policy_Content: str
    Similarity_Score: float
    Predicted_Impact_Score: float


# ------------------------------------------------------------
# LEGACY RESPONSE (for the older similarity engine)
# ------------------------------------------------------------

class SimulationResponse(BaseModel):
    query: SimulationQuery
    analogies: List[AnalogyResult]


# ------------------------------------------------------------
# NEW RESPONSE MODEL (matches updated /simulate endpoint)
# KEEPING IT SEPARATE TO AVOID BREAKING OLD CODE
# ------------------------------------------------------------

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
