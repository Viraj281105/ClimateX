from fastapi import FastAPI
from app.api.v1.api import api_router
from app.services import analogy_service  # <-- IMPORT THE SERVICE

# Create the main FastAPI application instance
app = FastAPI(title="ClimateX API")

# --- Add Startup Event ---
@app.on_event("startup")
def on_startup():
    """
    Event handler that runs when the server starts.
    This is where we load our models and data.
    """
    print("Server is starting up...")
    analogy_service.load_knowledge_base()
    print("--- Startup complete ---")
# -------------------------


# A simple root endpoint to check if the server is up
@app.get("/", tags=["Root"])
def read_root():
    return {"Hello": "Welcome to the ClimateX API"}

# Include the V1 router with the /api/v1 prefix
app.include_router(api_router, prefix="/api/v1")