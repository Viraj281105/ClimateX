from fastapi import APIRouter
from app.api.v1.endpoints import simulator, sentiment, dashboard, recommender, topics, sentinel, causal_engine, agentic_simulator, intelligence_hub, query_dispatcher, live_stream, history_ledger

api_router = APIRouter()

# Include each endpoint router with a specific prefix
# This creates paths like /api/v1/causal/test
api_router.include_router(simulator.router, prefix="/causal", tags=["Causal Simulator"])
api_router.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment Analysis"])
api_router.include_router(dashboard.router, prefix="/climate", tags=["Climate Dashboard"])
api_router.include_router(recommender.router, prefix="/policies", tags=["Policy Recommender"])
api_router.include_router(topics.router, prefix="/topics", tags=["Topics"])
api_router.include_router(sentinel.router, prefix="/sentinel", tags=["Sentinel Forecaster"])
api_router.include_router(causal_engine.router, prefix="/causal-graph", tags=["Causal Graph Engine"])
api_router.include_router(agentic_simulator.router, prefix="/agentic", tags=["Agentic Stakeholder Simulator"])
api_router.include_router(intelligence_hub.router, prefix="/intelligence", tags=["Micro-Intelligence Hub"])
api_router.include_router(query_dispatcher.router, prefix="/query", tags=["Query Dispatcher"])
api_router.include_router(live_stream.router, prefix="/live", tags=["Live Telemetry"])
api_router.include_router(history_ledger.router, prefix="/history", tags=["Simulation History"])