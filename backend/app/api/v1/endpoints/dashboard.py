import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict, Any

print("--- Initializing Climate Dashboard Endpoints ---")

# --- 1. Setup: Load Master Data ---
try:
    FILE_DIR = Path(__file__).parent
    ROOT_DIR = FILE_DIR.parents[4] # Navigates to the project root
    
    # Path to the fully merged and cleaned dataset from Script 3
    MASTER_DATA_PATH = ROOT_DIR / "data" / "processed" / "master_dataset_india.csv"
    
    if not MASTER_DATA_PATH.exists():
        raise FileNotFoundError(f"Master dataset not found at: {MASTER_DATA_PATH}")

    # Load the data once at startup
    df_master = pd.read_csv(MASTER_DATA_PATH)
    
    # Identify key columns
    ALL_POLLUTANT_COLS = [col for col in df_master.columns if col.startswith(('EDGAR_', 'HCB_', 'PAH_', 'PCB_', 'PCDD_'))]
    ALL_CONFOUNDER_COLS = [
        'confounder_gdp',
        'confounder_industry_pct',
        'confounder_population',
        'confounder_renewables_pct'
    ]
    
    # Clean up column names based on earlier scripts
    df_master = df_master.rename(columns={
        'GDP per capita (constant 2015 US$)': 'confounder_gdp',
        'Industry (including construction), value added (% of GDP)': 'confounder_industry_pct',
        'Population, total': 'confounder_population',
        'Renewable energy consumption (% of total final energy consumption)': 'confounder_renewables_pct'
    })
    
    # Final cleanup of data for API use
    df_master = df_master.dropna(subset=['Year'] + ALL_CONFOUNDER_COLS).sort_values(by='Year')
    
    print(f"✅ Dashboard loaded master data ({len(df_master)} rows).")

except Exception as e:
    print(f"❌ CRITICAL STARTUP ERROR (Dashboard): {e}")
    df_master = None

router = APIRouter()

# --- 2. Define API Output Models ---

class TimeSeriesPoint(BaseModel):
    year: int
    value: float

class PollutantTimeSeriesResponse(BaseModel):
    pollutant: str
    unit: str # General unit for display (e.g., kilotons/year)
    data: List[TimeSeriesPoint]

class ConfounderTimeSeriesResponse(BaseModel):
    indicator: str
    data: List[TimeSeriesPoint]

# --- 3. API Endpoints ---

@router.get("/pollutants", response_model=List[PollutantTimeSeriesResponse])
async def get_pollutant_time_series():
    """
    Retrieves the time series data for all major pollutants (e.g., CO, SO2, PM).
    """
    if df_master is None:
        raise HTTPException(status_code=503, detail="Dashboard data is unavailable.")
    
    all_series = []
    
    for col in ALL_POLLUTANT_COLS:
        if col in df_master.columns:
            # Format the column name for the frontend
            clean_name = col.replace('_1970_2022', '').replace('_', ' ')
            
            # Extract year and value pairs
            data_points = [
                TimeSeriesPoint(year=int(row['Year']), value=float(row[col]))
                for index, row in df_master.iterrows() if pd.notna(row[col])
            ]
            
            all_series.append(PollutantTimeSeriesResponse(
                pollutant=clean_name,
                unit="kilotons/year",
                data=data_points
            ))
            
    return all_series

@router.get("/confounders", response_model=List[ConfounderTimeSeriesResponse])
async def get_confounder_time_series():
    """
    Retrieves the time series data for key economic/social indicators (confounders).
    """
    if df_master is None:
        raise HTTPException(status_code=503, detail="Dashboard data is unavailable.")
    
    all_series = []
    
    # Columns to serve (from the renamed master DataFrame)
    CONFOUNDER_MAP = {
        'confounder_gdp': 'GDP per capita (2015 US$)',
        'confounder_population': 'Total Population',
        'confounder_renewables_pct': 'Renewable Energy Share (%)',
        'confounder_industry_pct': 'Industry Value Add (%)'
    }
    
    for internal_col, display_name in CONFOUNDER_MAP.items():
        if internal_col in df_master.columns:
            
            data_points = [
                TimeSeriesPoint(year=int(row['Year']), value=float(row[internal_col]))
                for index, row in df_master.iterrows() if pd.notna(row[internal_col])
            ]
            
            all_series.append(ConfounderTimeSeriesResponse(
                indicator=display_name,
                data=data_points
            ))
            
    return all_series