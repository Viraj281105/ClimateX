from fastapi import APIRouter, HTTPException
from app.services import analogy_service
from app.models.simulator import SimulationQuery, SimulationResponse # <-- Uses new models
import pandas as pd

router = APIRouter() # <-- This line fixes the AttributeError

# This is the real endpoint for Phase 1
@router.post("/simulate", response_model=SimulationResponse)
def run_simulation(query: SimulationQuery): # <-- Uses new query model
    """
    Run the Causal Policy Impact Simulation.
    
    Receives a query with policy features and returns
    a list of analogous policies and their predicted impact.
    """
    try:
        # 1. Convert the Pydantic model to a DataFrame
        query_df = pd.DataFrame([query.dict()])

        # 2. Call the service
        analogy_results = analogy_service.find_analogies(query_df)

        # 3. Format and return the response
        response = SimulationResponse(
            query=query,
            analogies=analogy_results
        )
        return response

    except Exception as e:
        print(f"Error during simulation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during simulation.")