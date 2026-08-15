from fastapi import APIRouter, Query, Body, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import re

router = APIRouter()

# -----------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------
class QueryRequest(BaseModel):
    user_query: str

class QueryResponse(BaseModel):
    query: str
    inferred_subsystem: str  # "Causal Engine", "Agentic Stakeholder", "Sentinel Forecaster", "Policy Recommender"
    confidence_score: float
    analytics_payload: Dict[str, Any]

# -----------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------
@router.post("/", response_model=QueryResponse, tags=["Query Dispatcher"])
async def dispatch_query(
    req: QueryRequest
):
    """
    Intelligently routes a natural language query to the appropriate subsystem,
    executing it and returning a consolidated payload.
    """
    q = req.user_query.lower()
    
    # Simple regex classifier mimicking an NLP router
    if any(k in q for k in ["cause", "causal", "counterfactual", "impact of", "dag", "why"]):
        inferred = "Causal Engine"
        confidence = 0.95
        # Simulate / trigger causal engine response
        from app.api.v1.endpoints.causal_engine import generate_causal_dag
        payload = await generate_causal_dag(
            policy_type="Renewable Energy",
            action_type="Subsidies",
            pollutant="Air Pollution (PM/NOx)"
        )
        payload_dict = payload.dict()
        
    elif any(k in q for k in ["stakeholder", "farmer", "compliance", "citizen", "public", "agree", "oppose"]):
        inferred = "Agentic Stakeholder"
        confidence = 0.92
        # Trigger agentic timeline
        from app.api.v1.endpoints.agentic_simulator import simulate_agentic_timeline, AgenticSimulationRequest
        payload = await simulate_agentic_timeline(
            request=AgenticSimulationRequest(policy_text=req.user_query),
            policy_type="Renewable Energy",
            action_type="Subsidies"
        )
        payload_dict = payload.dict()
        
    elif any(k in q for k in ["forecast", "future", "predict", "anomaly", "alert", "sentinel", "temperature", "2030", "2040", "2050"]):
        inferred = "Sentinel Forecaster"
        confidence = 0.90
        # Trigger sentinel forecast & alerts
        from app.api.v1.endpoints.sentinel import get_sentinel_forecast, get_regional_anomalies
        forecast = await get_sentinel_forecast(target_year=2035)
        anomalies = await get_regional_anomalies()
        payload_dict = {
            "forecasts": [f.dict() for f in forecast],
            "anomalies": [a.dict() for a in anomalies]
        }
    else:
        inferred = "Policy Recommender"
        confidence = 0.85
        # Trigger RAG mock recommendation
        payload_dict = {
            "recommendation_summary": "Based on Ministry of Environment (MoEFCC) reports, transitioning industrial corridors to clean gas networks yields immediate particulate reductions.",
            "source_documents": ["MoEFCC Action Plan 2024.pdf", "National Clean Air Programme Guideline.pdf"],
            "relevance_score": 0.88
        }

    return QueryResponse(
        query=req.user_query,
        inferred_subsystem=inferred,
        confidence_score=confidence,
        analytics_payload=payload_dict
    )
