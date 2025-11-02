from pydantic import BaseModel
from typing import List

# Define the structure of the incoming query from the frontend
class SimulationQuery(BaseModel):
    policy_type: str
    action_type: str  # <-- CHANGED: This matches your data
    
    # Example of what the frontend will send:
    # {
    #   "policy_type": "Air Quality Regulation",
    #   "action_type": "Emission Standards"
    # }

# Define the structure of a single analogy result
class AnalogyResult(BaseModel):
    Policy: str           # From features_db['Policy']
    policy_type: str      # From features_db['policy_type']
    action_type: str      # From features_db['action_type']
    Policy_Content: str   # From features_db['Policy_Content']
    Similarity_Score: float
    Predicted_Impact_Score: float # From impact_db['ate']

# Define the final response structure
class SimulationResponse(BaseModel):
    query: SimulationQuery
    analogies: List[AnalogyResult]