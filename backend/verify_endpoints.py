import sys
import os

# Add backend root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_sentinel():
    print("Testing /api/v1/sentinel/forecast...")
    response = client.get("/api/v1/sentinel/forecast?target_year=2035")
    assert response.status_code == 200
    data = response.json()
    print("Forecast keys:", [d["indicator"] for d in data])
    assert len(data) > 0

    print("Testing /api/v1/sentinel/anomalies...")
    response = client.get("/api/v1/sentinel/anomalies")
    assert response.status_code == 200
    data = response.json()
    print("Anomalies regions:", [d["region_name"] for d in data])
    assert len(data) > 0

def test_causal():
    print("Testing /api/v1/causal-graph/generate-dag...")
    response = client.post("/api/v1/causal-graph/generate-dag?policy_type=Renewable%20Energy&action_type=Subsidies&pollutant=Air%20Pollution%20(PM/NOx)")
    assert response.status_code == 200
    data = response.json()
    print("Causal Graph nodes count:", len(data["nodes"]))
    print("Causal Graph edges count:", len(data["edges"]))
    assert len(data["nodes"]) > 0

def test_agentic():
    print("Testing /api/v1/agentic/simulate-timeline...")
    response = client.post(
        "/api/v1/agentic/simulate-timeline?policy_type=Waste%20Management&action_type=Ban",
        json={"policy_text": "Ban single-use plastics across metropolitan cities by 2026."}
    )
    if response.status_code != 200:
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    assert response.status_code == 200
    data = response.json()
    print("Simulation trajectory points:", len(data["trajectory"]))
    print("First year compliance rate:", data["trajectory"][0]["compliance_rate"])
    assert len(data["trajectory"]) == 5

def test_intelligence():
    print("Testing /api/v1/intelligence/carbon-ledger...")
    response = client.post(
        "/api/v1/intelligence/carbon-ledger",
        json=[
            {"project_type": "Solar", "quantity": 100.0},
            {"project_type": "Afforestation", "quantity": 50.0}
        ]
    )
    assert response.status_code == 200
    data = response.json()
    print("Carbon Offset (tons):", data["total_co2_offset_tons"])
    assert data["total_co2_offset_tons"] > 0

    print("Testing /api/v1/intelligence/micro-grid...")
    response = client.get("/api/v1/intelligence/micro-grid?region=Delhi-NCR")
    assert response.status_code == 200
    data = response.json()
    print("Micro-grid cells count:", len(data["cells"]))
    assert len(data["cells"]) == 9

    print("Testing /api/v1/intelligence/emergency-alerts...")
    response = client.get("/api/v1/intelligence/emergency-alerts?alert_type=Heatwave")
    assert response.status_code == 200
    data = response.json()
    print("Emergency alert headline:", data["headline"])
    assert "EXTREME TEMPERATURE" in data["headline"]

    print("Testing /api/v1/intelligence/climate-clock...")
    response = client.get("/api/v1/intelligence/climate-clock")
    assert response.status_code == 200
    data = response.json()
    print("Climate clock budget left:", data["carbon_budget_left_gt"])
    assert data["years_remaining"] > 0

    print("Testing /api/v1/intelligence/ev-fleet...")
    response = client.post("/api/v1/intelligence/ev-fleet", json={"fleet_size": 50, "vehicle_type": "Sedan", "avg_daily_km": 120.0})
    assert response.status_code == 200
    assert response.json()["annual_co2_offset_tons"] > 0

    print("Testing /api/v1/intelligence/crop-yield...")
    response = client.post("/api/v1/intelligence/crop-yield", json={"crop_name": "Wheat", "state": "Punjab", "temperature_anomaly": 1.5, "rainfall_anomaly_pct": -10.0})
    assert response.status_code == 200
    assert response.json()["yield_vulnerability_index"] > 0

    print("Testing /api/v1/intelligence/methane-sources...")
    response = client.get("/api/v1/intelligence/methane-sources?region=Mumbai")
    assert response.status_code == 200
    assert response.json()["active_hotspots_found"] > 0

    print("Testing /api/v1/intelligence/health-advisory...")
    response = client.get("/api/v1/intelligence/health-advisory?aqi=150")
    assert response.status_code == 200
    assert "Unhealthy" in response.json()["health_category"]

    print("Testing /api/v1/intelligence/carbon-tax-invoice...")
    response = client.post("/api/v1/intelligence/carbon-tax-invoice", json={"company_name": "Acme Industries", "electricity_kwh": 500000.0, "diesel_liters": 2500.0, "waste_tons": 12.0})
    assert response.status_code == 200
    assert response.json()["carbon_tax_due_inr"] > 0

    print("Testing /api/v1/intelligence/water-stress...")
    response = client.get("/api/v1/intelligence/water-stress?district=Marathwada")
    assert response.status_code == 200
    assert "ACUTE" in response.json()["stress_category"]

    print("Testing /api/v1/intelligence/grid-curtailment...")
    response = client.get("/api/v1/intelligence/grid-curtailment?plant_name=Bhadla%20Solar%20Park")
    assert response.status_code == 200
    assert response.json()["curtailment_probability_pct"] > 0

    print("Testing /api/v1/intelligence/green-roofs...")
    response = client.post("/api/v1/intelligence/green-roofs", json={"roof_area_sqm": 250.0, "climate_zone": "Composite"})
    assert response.status_code == 200
    assert response.json()["annual_hvac_savings_inr"] > 0

    print("Testing /api/v1/intelligence/climate-refugees...")
    response = client.get("/api/v1/intelligence/climate-refugees?zone_name=Sundarbans%20Delta")
    assert response.status_code == 200
    assert response.json()["displacement_risk_score"] > 0

    print("Testing /api/v1/intelligence/eco-tourism...")
    response = client.post("/api/v1/intelligence/eco-tourism", json={"destination_name": "Jim Corbett National Park", "visitor_count_per_month": 4500, "waste_recycled_pct": 82.5})
    assert response.status_code == 200
    assert response.json()["eco_footprint_score"] > 0

def test_dispatcher_stream_ledger():
    print("Testing /api/v1/query/ dispatcher...")
    response = client.post("/api/v1/query/", json={"user_query": "What is the forecasted temperature in 2040?"})
    assert response.status_code == 200
    data = response.json()
    assert data["inferred_subsystem"] == "Sentinel Forecaster"
    assert "forecasts" in data["analytics_payload"]

    print("Testing /api/v1/live/poll telemetry...")
    response = client.get("/api/v1/live/poll")
    assert response.status_code == 200
    assert "aqi_sensor_delhi" in response.json()

    print("Testing /api/v1/history/ ledger save...")
    response_a = client.post("/api/v1/history/save", json={
        "policy_name": "Subsidized Solar Grids",
        "policy_type": "Renewable Energy",
        "action_type": "Subsidies",
        "target_pollutant": "Carbon Dioxide (CO2)",
        "emissions_reduction": 28.5,
        "economic_impact": 1.2
    })
    assert response_a.status_code == 200
    id_a = response_a.json()["id"]

    response_b = client.post("/api/v1/history/save", json={
        "policy_name": "Coal Tar Tax Regulation",
        "policy_type": "Industrial Regulation",
        "action_type": "Tax",
        "target_pollutant": "Carbon Dioxide (CO2)",
        "emissions_reduction": 14.8,
        "economic_impact": 3.6
    })
    assert response_b.status_code == 200
    id_b = response_b.json()["id"]

    print("Testing /api/v1/history/list ledger...")
    response = client.get("/api/v1/history/list")
    assert response.status_code == 200
    assert len(response.json()) >= 2

    print("Testing /api/v1/history/compare ledger...")
    response = client.get(f"/api/v1/history/compare?id_a={id_a}&id_b={id_b}")
    assert response.status_code == 200
    assert response.json()["efficiency_difference_pct"] > 0

if __name__ == "__main__":
    try:
        test_sentinel()
        test_causal()
        test_agentic()
        test_intelligence()
        test_dispatcher_stream_ledger()
        print("\nAll endpoints verified successfully!")
    except AssertionError as e:
        print("Verification failed: Assertion error.", e)
        sys.exit(1)
    except Exception as e:
        print("Verification failed with exception:", e)
        sys.exit(1)
