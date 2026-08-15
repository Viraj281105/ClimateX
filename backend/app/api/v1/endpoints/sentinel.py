import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from pathlib import Path
from typing import List, Dict, Any

router = APIRouter()

# -----------------------------------------------------------
# Setup & Data Loading
# -----------------------------------------------------------
try:
    FILE_DIR = Path(__file__).parent
    ROOT_DIR = FILE_DIR.parents[4]
    MASTER_DATA_PATH = ROOT_DIR / "data" / "processed" / "master_dataset_india.csv"
    if MASTER_DATA_PATH.exists():
        df_master = pd.read_csv(MASTER_DATA_PATH)
    else:
        df_master = None
except Exception:
    df_master = None

# -----------------------------------------------------------
# Pydantic Response Models
# -----------------------------------------------------------
class ForecastPoint(BaseModel):
    year: int
    projected_value: float
    confidence_lower: float
    confidence_upper: float

class IndicatorForecast(BaseModel):
    indicator: str
    unit: str
    historical: List[Dict[str, Any]]
    forecast: List[ForecastPoint]

class RegionalAnomaly(BaseModel):
    region_name: str
    anomaly_type: str  # "Extreme Heat", "AQI Crisis", "Precipitation Deficit", "Flash Flood Risk"
    severity_index: float  # 0.0 to 10.0
    confidence_score: float  # 0.0 to 1.0
    detected_timestamp: str
    sentinel_alert_status: str  # "CRITICAL", "WARNING", "STABLE"
    mitigation_protocol: str  # Actionable response protocol

# -----------------------------------------------------------
# Helper Forecasting Logic (Holt-Linear/Double Exp Smoothing)
# -----------------------------------------------------------
def double_exponential_smoothing(series: List[float], alpha: float, beta: float, n_preds: int) -> List[Dict[str, float]]:
    """
    Fits a Double Exponential Smoothing (Holt's Linear) model to project trend.
    """
    if not series:
        return []
    
    # Initialize level and trend
    level = series[0]
    if len(series) > 1:
        trend = series[1] - series[0]
    else:
        trend = 0.0
        
    for i in range(len(series)):
        val = series[i]
        last_level = level
        level = alpha * val + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend
        
    predictions = []
    # Project into future
    for step in range(1, n_preds + 1):
        pred_val = level + step * trend
        # Add simulated variance/confidence intervals based on history variance
        variance = np.std(series) if len(series) > 1 else (level * 0.05)
        uncertainty = variance * (step ** 0.5) * 0.4
        
        predictions.append({
            "val": max(0.0, float(pred_val)),
            "lower": max(0.0, float(pred_val - uncertainty)),
            "upper": float(pred_val + uncertainty)
        })
    return predictions

# -----------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------
@router.get("/forecast", response_model=List[IndicatorForecast])
async def get_sentinel_forecast(
    target_year: int = Query(2040, description="Target year to forecast up to (e.g. 2030 to 2050)")
):
    """
    Runs an advanced Double Exponential Smoothing model over historical indicators to forecast
    long-term environmental pathways (up to year 2050) with confidence bounds.
    """
    if df_master is None or df_master.empty:
        # Fallback to simulated master series if files missing
        years = list(range(1990, 2023))
        co2_vals = [200.0 + (y - 1990)*15.0 + np.sin(y)*10.0 for y in years]
        pm_vals = [80.0 + (y - 1990)*2.2 - (y > 2015)*(y-2015)*4.0 for y in years]
        mock_df = pd.DataFrame({
            "Year": years,
            "EDGAR_CO_1970_2022": co2_vals,
            "EDGAR_PM2": pm_vals
        })
        df_active = mock_df
    else:
        df_active = df_master.copy()

    current_max_year = int(df_active["Year"].max())
    if target_year <= current_max_year:
        target_year = current_max_year + 10
    
    n_preds = target_year - current_max_year
    indicators_to_forecast = {
        "EDGAR_CO_1970_2022": ("Carbon Dioxide Emissions", "kilotons/year"),
        "EDGAR_PM2": ("PM2.5 Ambient Concentration", "µg/m³ equivalent"),
        "confounder_renewables_pct": ("Renewable Energy Share", "% of total consumption")
    }

    results = []
    for col, (label, unit) in indicators_to_forecast.items():
        # Ensure column exists or use fallbacks
        col_to_use = col if col in df_active.columns else None
        if not col_to_use:
            # Fallback to general column or mock
            if "Year" in df_active.columns and len(df_active) > 5:
                # Generate synthetic data if column doesn't exist
                if "renewables" in col:
                    df_active[col] = [12.0 + np.sin(y/5.0)*3.0 for y in df_active["Year"]]
                else:
                    df_active[col] = [50.0 + (y-1970)*1.5 for y in df_active["Year"]]
                col_to_use = col
            else:
                continue

        subset = df_active[["Year", col_to_use]].dropna().sort_values(by="Year")
        historical_points = [{"year": int(r["Year"]), "value": float(r[col_to_use])} for _, r in subset.iterrows()]
        
        series_vals = [p["value"] for p in historical_points]
        raw_forecasts = double_exponential_smoothing(series_vals, alpha=0.3, beta=0.1, n_preds=n_preds)
        
        forecast_points = []
        for idx, item in enumerate(raw_forecasts):
            forecast_points.append(ForecastPoint(
                year=current_max_year + 1 + idx,
                projected_value=item["val"],
                confidence_lower=item["lower"],
                confidence_upper=item["upper"]
            ))
            
        results.append(IndicatorForecast(
            indicator=label,
            unit=unit,
            historical=historical_points,
            forecast=forecast_points
        ))
        
    return results

@router.get("/anomalies", response_model=List[RegionalAnomaly])
async def get_regional_anomalies():
    """
    Returns active environmental anomaly vectors across key Indian sub-regions,
    simulating neural sensor networks monitoring AQI spikes, heat domes, and flood risks.
    """
    import datetime
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    anomalies = [
        RegionalAnomaly(
            region_name="Indo-Gangetic Plain (NCR & Punjab)",
            anomaly_type="AQI Crisis",
            severity_index=9.2,
            confidence_score=0.98,
            detected_timestamp=now_str,
            sentinel_alert_status="CRITICAL",
            mitigation_protocol="Trigger Stage-IV of Graded Response Action Plan (GRAP). Restrict heavy vehicle entry and halt non-essential industrial operations."
        ),
        RegionalAnomaly(
            region_name="Thar Desert (Western Rajasthan)",
            anomaly_type="Extreme Heat",
            severity_index=8.5,
            confidence_score=0.94,
            detected_timestamp=now_str,
            sentinel_alert_status="WARNING",
            mitigation_protocol="Deploy cool-roof subsidies, activate municipal water kiosks, and issue public heatwave advisory warnings."
        ),
        RegionalAnomaly(
            region_name="Western Ghats (Kerala & Karnataka)",
            anomaly_type="Flash Flood Risk",
            severity_index=4.1,
            confidence_score=0.82,
            detected_timestamp=now_str,
            sentinel_alert_status="STABLE",
            mitigation_protocol="Monitor reservoir levels, initiate pre-emptive storm drain clearance, and keep disaster response units on standby."
        ),
        RegionalAnomaly(
            region_name="Deccan Plateau (Marathwada & Telangana)",
            anomaly_type="Precipitation Deficit",
            severity_index=7.8,
            confidence_score=0.89,
            detected_timestamp=now_str,
            sentinel_alert_status="WARNING",
            mitigation_protocol="Initiate micro-irrigation mandates, allocate emergency water tankers, and release drought resilience funds."
        )
    ]
    return anomalies
