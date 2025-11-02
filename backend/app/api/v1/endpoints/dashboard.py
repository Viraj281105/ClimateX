 
from fastapi import APIRouter

router = APIRouter()

# We will add the real endpoint in Phase 3
@router.get("/test")
def test_dashboard():
    return {"message": "Dashboard endpoint is live"}