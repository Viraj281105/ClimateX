import asyncio
import random
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

# -----------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------
class LiveTelemetryPoint(BaseModel):
    timestamp: float
    aqi_sensor_delhi: float
    aqi_sensor_mumbai: float
    solar_generation_kw: float
    wind_generation_kw: float
    anomaly_status: str  # "STABLE", "WARNING", "CRITICAL"
    satellite_feed_log: str

# Helper to generate simulated telemetry
def generate_telemetry_tick() -> Dict[str, Any]:
    logs = [
        "MODIS satellite reports thermal anomaly in Thar Desert.",
        "Sentinel-5P detects ozone column thinning in Western India.",
        "Ground sensor DEL-04 reports PM2.5 spike due to local emissions.",
        "Renewable grid feed experiences minor frequency deviation.",
        "Telemetry stable across all 4 region grids."
    ]
    
    delhi_aqi = round(150.0 + random.uniform(-10.0, 15.0) + (time.time() % 60) * 2.0, 1)
    mumbai_aqi = round(70.0 + random.uniform(-5.0, 8.0) + (time.time() % 60) * 0.5, 1)
    
    status = "STABLE"
    if delhi_aqi > 240.0:
        status = "CRITICAL"
    elif delhi_aqi > 190.0:
        status = "WARNING"
        
    return {
        "timestamp": time.time(),
        "aqi_sensor_delhi": delhi_aqi,
        "aqi_sensor_mumbai": mumbai_aqi,
        "solar_generation_kw": round(450.0 + random.uniform(-50.0, 80.0), 2),
        "wind_generation_kw": round(120.0 + random.uniform(-20.0, 40.0), 2),
        "anomaly_status": status,
        "satellite_feed_log": random.choice(logs)
    }

# -----------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------

@router.get("/poll", response_model=LiveTelemetryPoint, tags=["Live Telemetry"])
async def poll_telemetry():
    """
    HTTP GET endpoint for polling telemetry. Useful as a fallback for browsers
    or clients not utilizing WebSockets.
    """
    return LiveTelemetryPoint(**generate_telemetry_tick())

@router.websocket("/ws")
async def websocket_telemetry_stream(websocket: WebSocket):
    """
    WebSocket endpoint streaming live telemetry frames every 1.5 seconds.
    """
    await websocket.accept()
    try:
        while True:
            data = generate_telemetry_tick()
            await websocket.send_json(data)
            await asyncio.sleep(1.5)
    except WebSocketDisconnect:
        print("Telemetry WebSocket disconnected.")
    except Exception as e:
        print(f"WebSocket Error: {e}")
        await websocket.close()
