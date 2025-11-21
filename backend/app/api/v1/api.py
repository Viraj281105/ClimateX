from fastapi import APIRouter
from app.api.v1.endpoints import simulator, sentiment, dashboard, recommender, topics

api_router = APIRouter()

# Include each endpoint router with a specific prefix
# This creates paths like /api/v1/causal/test
api_router.include_router(simulator.router, prefix="/causal", tags=["Causal Simulator"])
api_router.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment Analysis"])
api_router.include_router(dashboard.router, prefix="/climate", tags=["Climate Dashboard"])
api_router.include_router(recommender.router, prefix="/policies", tags=["Policy Recommender"])
api_router.include_router(topics.router, prefix="/topics", tags=["Topics"])