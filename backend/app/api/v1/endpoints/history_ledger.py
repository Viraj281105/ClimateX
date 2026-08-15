import sqlite3
import os
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "climatex_history.db")

# Initialize database table
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS simulation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_name TEXT NOT NULL,
            policy_type TEXT NOT NULL,
            action_type TEXT NOT NULL,
            target_pollutant TEXT NOT NULL,
            emissions_reduction REAL,
            economic_impact REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

# -----------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------
class HistoryRecordRequest(BaseModel):
    policy_name: str
    policy_type: str
    action_type: str
    target_pollutant: str
    emissions_reduction: float
    economic_impact: float

class HistoryRecordResponse(BaseModel):
    id: int
    policy_name: str
    policy_type: str
    action_type: str
    target_pollutant: str
    emissions_reduction: float
    economic_impact: float
    created_at: str

class ComparisonResponse(BaseModel):
    policy_a: HistoryRecordResponse
    policy_b: HistoryRecordResponse
    efficiency_difference_pct: float
    economic_benefit_difference: float

# -----------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------

@router.post("/save", response_model=HistoryRecordResponse, tags=["Simulation History"])
async def save_simulation(record: HistoryRecordRequest):
    """
    Saves a policy simulation output into the SQLite ledger.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO simulation_history 
            (policy_name, policy_type, action_type, target_pollutant, emissions_reduction, economic_impact)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (record.policy_name, record.policy_type, record.action_type, record.target_pollutant, record.emissions_reduction, record.economic_impact))
        conn.commit()
        last_id = cursor.lastrowid
        
        # Select what we just inserted
        cursor.execute("SELECT id, policy_name, policy_type, action_type, target_pollutant, emissions_reduction, economic_impact, created_at FROM simulation_history WHERE id = ?", (last_id,))
        row = cursor.fetchone()
        conn.close()
        
        return HistoryRecordResponse(
            id=row[0], policy_name=row[1], policy_type=row[2], action_type=row[3],
            target_pollutant=row[4], emissions_reduction=row[5], economic_impact=row[6], created_at=row[7]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insertion failed: {e}")

@router.get("/list", response_model=List[HistoryRecordResponse], tags=["Simulation History"])
async def list_simulations():
    """
    Retrieves all history records stored in the ledger.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, policy_name, policy_type, action_type, target_pollutant, emissions_reduction, economic_impact, created_at FROM simulation_history ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for r in rows:
            results.append(HistoryRecordResponse(
                id=r[0], policy_name=r[1], policy_type=r[2], action_type=r[3],
                target_pollutant=r[4], emissions_reduction=r[5], economic_impact=r[6], created_at=r[7]
            ))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database retrieval failed: {e}")

@router.get("/compare", response_model=ComparisonResponse, tags=["Simulation History"])
async def compare_simulations(
    id_a: int = Query(..., description="ID of policy A"),
    id_b: int = Query(..., description="ID of policy B")
):
    """
    Compares two saved policy simulations side-by-side, computing differences.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, policy_name, policy_type, action_type, target_pollutant, emissions_reduction, economic_impact, created_at FROM simulation_history WHERE id = ?", (id_a,))
        row_a = cursor.fetchone()
        
        cursor.execute("SELECT id, policy_name, policy_type, action_type, target_pollutant, emissions_reduction, economic_impact, created_at FROM simulation_history WHERE id = ?", (id_b,))
        row_b = cursor.fetchone()
        
        conn.close()
        
        if not row_a or not row_b:
            raise HTTPException(status_code=404, detail="One or both simulation IDs not found.")
            
        record_a = HistoryRecordResponse(
            id=row_a[0], policy_name=row_a[1], policy_type=row_a[2], action_type=row_a[3],
            target_pollutant=row_a[4], emissions_reduction=row_a[5], economic_impact=row_a[6], created_at=row_a[7]
        )
        record_b = HistoryRecordResponse(
            id=row_b[0], policy_name=row_b[1], policy_type=row_b[2], action_type=row_b[3],
            target_pollutant=row_b[4], emissions_reduction=row_b[5], economic_impact=row_b[6], created_at=row_b[7]
        )
        
        return ComparisonResponse(
            policy_a=record_a,
            policy_b=record_b,
            efficiency_difference_pct=float(round(record_a.emissions_reduction - record_b.emissions_reduction, 2)),
            economic_benefit_difference=float(round(record_b.economic_impact - record_a.economic_impact, 2)) # Lower economic cost is benefit
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {e}")
