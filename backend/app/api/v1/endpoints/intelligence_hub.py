import time
import math
from fastapi import APIRouter, Query, Body
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

# -----------------------------------------------------------
# Pydantic Schemas (Originals)
# -----------------------------------------------------------
class CarbonProject(BaseModel):
    project_type: str
    quantity: float

class CarbonLedgerResponse(BaseModel):
    total_co2_offset_tons: float
    carbon_tax_savings_inr: float
    green_bonds_credits_generated: float
    project_summaries: List[Dict[str, Any]]

class GridCell(BaseModel):
    latitude: float
    longitude: float
    solar_irradiance: float
    wind_density: float
    forest_canopy_index: float
    soil_moisture_pct: float

class MicroGridResponse(BaseModel):
    region: str
    grid_resolution: str
    cells: List[GridCell]

class EmergencyAlertResponse(BaseModel):
    cap_identifier: str
    sender: str
    sent_time: str
    status: str
    msg_type: str
    scope: str
    urgency: str
    severity: str
    certainty: str
    headline: str
    description: str
    sms_copy: str
    radio_announcement_script: str

class ClimateClockResponse(BaseModel):
    years_remaining: int
    days_remaining: int
    hours_remaining: int
    seconds_remaining: int
    carbon_budget_left_gt: float
    global_temp_increase: float
    emissions_rate_per_sec_tons: float

# -----------------------------------------------------------
# Pydantic Schemas (10 New Features)
# -----------------------------------------------------------
class EVFleetRequest(BaseModel):
    fleet_size: int
    vehicle_type: str  # "Bus", "Two-Wheeler", "Three-Wheeler", "Sedan"
    avg_daily_km: float

class EVFleetResponse(BaseModel):
    annual_co2_offset_tons: float
    annual_fuel_savings_inr: float
    peak_grid_load_mw: float
    battery_life_decay_pct_per_year: float

class CropYieldRequest(BaseModel):
    crop_name: str  # "Rice", "Wheat", "Sugarcane"
    state: str
    temperature_anomaly: float  # difference in Celsius
    rainfall_anomaly_pct: float  # difference in percentage

class CropYieldResponse(BaseModel):
    crop_name: str
    state: str
    yield_vulnerability_index: float  # 0.0 to 10.0
    predicted_yield_change_pct: float
    adaptation_strategies: List[str]

class MethaneHotspot(BaseModel):
    source_id: str
    source_type: str  # "Landfill", "Rice Paddy", "Coal Mine"
    leak_rate_kg_hr: float
    latitude: float
    longitude: float
    confidence_score: float

class MethaneTrackerResponse(BaseModel):
    active_hotspots_found: int
    total_leak_rate_kg_hr: float
    hotspots: List[MethaneHotspot]

class HealthAdvisoryResponse(BaseModel):
    aqi: int
    health_category: str  # "Good", "Moderate", "Unhealthy", "Hazardous"
    general_advisory: str
    sensitive_group_advisory: str
    outdoor_activity_recommendation: str

class CorporateCarbonInvoiceRequest(BaseModel):
    company_name: str
    electricity_kwh: float
    diesel_liters: float
    waste_tons: float

class CorporateCarbonInvoiceResponse(BaseModel):
    total_emissions_tons_co2: float
    carbon_tax_due_inr: float
    rebate_qualification_pathways: List[str]

class WaterStressResponse(BaseModel):
    district: str
    current_reservoir_level_pct: float
    projected_days_to_scarcity: int
    stress_category: str  # "LOW", "MODERATE", "ACUTE"

class GridCurtailmentResponse(BaseModel):
    plant_name: str
    curtailment_probability_pct: float
    congested_transmission_corridor: str
    suggested_battery_arbitrage_capacity_mwh: float

class GreenRoofRequest(BaseModel):
    roof_area_sqm: float
    climate_zone: str  # "Hot & Dry", "Composite", "Warm & Humid"

class GreenRoofResponse(BaseModel):
    annual_hvac_savings_inr: float
    roof_surface_temp_reduction_celsius: float
    stormwater_retained_liters_per_year: float

class RefugeeRiskResponse(BaseModel):
    zone_name: str
    displacement_risk_score: float  # 0.0 to 10.0
    sea_level_rise_projection_cm_by_2050: float
    vulnerable_population_count: int

class EcoTourismRequest(BaseModel):
    destination_name: str
    visitor_count_per_month: int
    waste_recycled_pct: float

class EcoTourismResponse(BaseModel):
    eco_footprint_score: float  # 0.0 to 10.0
    tourism_surcharge_collected_inr: float
    conservation_project_funding_allocation: Dict[str, float]

# -----------------------------------------------------------
# API Endpoints (Originals)
# -----------------------------------------------------------
@router.post("/carbon-ledger", response_model=CarbonLedgerResponse, tags=["Micro-Intelligence Hub"])
async def calculate_carbon_ledger(projects: List[CarbonProject]):
    factors = {"Solar": 850.0, "Wind": 950.0, "Afforestation": 22.0, "Waste-to-Energy": 450.0}
    tax_rate = 400.0
    total_offset = 0.0
    project_summaries = []
    for p in projects:
        factor = factors.get(p.project_type, 100.0)
        offset = p.quantity * factor
        savings = offset * tax_rate
        credits = offset * 0.1
        project_summaries.append({
            "project_type": p.project_type,
            "quantity": p.quantity,
            "annual_offset_tons": float(round(offset, 2)),
            "annual_tax_savings_inr": float(round(savings, 2)),
            "credits_earned": float(round(credits, 2))
        })
        total_offset += offset
    total_savings = total_offset * tax_rate
    total_credits = total_offset * 0.1
    return CarbonLedgerResponse(
        total_co2_offset_tons=float(round(total_offset, 2)),
        carbon_tax_savings_inr=float(round(total_savings, 2)),
        green_bonds_credits_generated=float(round(total_credits, 2)),
        project_summaries=project_summaries
    )

@router.get("/micro-grid", response_model=MicroGridResponse, tags=["Micro-Intelligence Hub"])
async def get_micro_grid(region: str = Query("Delhi-NCR")):
    coord_map = {"Delhi-NCR": (28.61, 77.20), "Mumbai-MMR": (19.07, 72.87), "Bangalore": (12.97, 77.59), "Kolkata": (22.57, 88.36)}
    lat_center, lon_center = coord_map.get(region, (20.59, 78.96))
    cells = []
    for lat_offset in [-0.5, 0.0, 0.5]:
        for lon_offset in [-0.5, 0.0, 0.5]:
            lat = float(round(lat_center + lat_offset, 2))
            lon = float(round(lon_center + lon_offset, 2))
            seed_val = int(abs(lat * lon * 100))
            solar = float(round(4.0 + (seed_val % 30) / 10.0, 2))
            wind = float(round(150.0 + (seed_val % 400), 2))
            canopy = float(round(0.05 + (seed_val % 90) / 100.0, 2))
            moisture = float(round(10.0 + (seed_val % 80), 2))
            cells.append(GridCell(
                latitude=lat, longitude=lon, solar_irradiance=solar, wind_density=wind,
                forest_canopy_index=canopy, soil_moisture_pct=moisture
            ))
    return MicroGridResponse(region=region, grid_resolution="0.5 x 0.5 degree", cells=cells)

@router.get("/emergency-alerts", response_model=EmergencyAlertResponse, tags=["Micro-Intelligence Hub"])
async def generate_emergency_alerts(alert_type: str = Query("AQI")):
    import datetime
    now = datetime.datetime.utcnow().isoformat() + "Z"
    if alert_type.lower() == "aqi":
        headline = "CRITICAL AIR QUALITY ALERT: PM2.5 EXCEEDS 450 µg/m³ IN DELHI-NCR"
        description = "A massive air pollution anomaly has been detected across the NCR region. Wind patterns show static atmospheric conditions preventing dispersion. High risk for children, elderly, and respiratory patients."
        sms = "ALERT: Delhi-NCR AQI is Critical. Avoid outdoor activity. Stage-IV GRAP restrictions active. Wear N95 masks if traveling. - Govt Climate Sentinel"
        radio = "Attention residents of Delhi and NCR. The Climate Sentinel network has triggered a Level 4 air quality warning. Ambient particulate levels have exceeded severe thresholds. All industrial operations are temporarily halted, and residents are advised to remain indoors. Protect your family by sealing ventilation and running air purifiers where available."
    elif alert_type.lower() == "heatwave":
        headline = "EXTREME TEMPERATURE ADVISORY: HEAT DOME ACROSS THAR & MARATHWADA"
        description = "Sensors record dry surface temperatures above 47°C. High risk of thermal exhaustion and agricultural heat stress. Ground soil moisture is at critical lows."
        sms = "WARNING: Extreme Heatwave alert. Temperatures to exceed 47C. Drink ample water, stay indoors between 11 AM - 4 PM. - State Disaster Management"
        radio = "This is an emergency temperature broadcast. A severe heat dome has locked over western and central regions. Daily highs are projected to cross 47 degrees Celsius. Avoid exposure, especially during peak afternoon hours. Agricultural workers are advised to pause outdoor activities immediately."
    else:
        headline = "IMMEDIATE FLASH FLOOD WARNING: EXTREME PRECIPITATION IN WESTERN GHATS"
        description = "High-density rainfall exceeds 220mm within 6 hours. Rivers and catchment basins are at maximum capacity. Extreme threat of landslides and flash flooding."
        sms = "FLASH FLOOD WARNING: Heavy rain in Western Ghats. Avoid river banks and hilly areas. Evacuation orders active for low-lying zones. - NDRF"
        radio = "Emergency warning broadcast. The local river basins have exceeded peak safety margins due to extreme cloudburst patterns. If you are in a low-lying zone or hilly terrain, evacuate immediately to designated relief centers. High risk of local mudslides and torrents."
    return EmergencyAlertResponse(
        cap_identifier=f"IND-SEN-{int(time.time())}", sender="ClimateX-Sentinel-Core@cpcb.gov.in",
        sent_time=now, status="Actual", msg_type="Alert", scope="Public", urgency="Immediate",
        severity="Extreme", certainty="Observed", headline=headline, description=description,
        sms_copy=sms, radio_announcement_script=radio
    )

@router.get("/climate-clock", response_model=ClimateClockResponse, tags=["Micro-Intelligence Hub"])
async def get_climate_clock():
    target_time = 2002368000.0
    current_time = time.time()
    diff = max(0.0, target_time - current_time)
    years = int(diff // (365 * 24 * 3600))
    rem = diff % (365 * 24 * 3600)
    days = int(rem // (24 * 3600))
    rem = rem % (24 * 3600)
    hours = int(rem // 3600)
    seconds = int(rem % 3600)
    carbon_left = max(0.0, 290.0 - ((current_time - 1700000000) * 42.2 / 1e9))
    return ClimateClockResponse(
        years_remaining=years, days_remaining=days, hours_remaining=hours, seconds_remaining=seconds,
        carbon_budget_left_gt=float(round(carbon_left, 4)), global_temp_increase=1.28, emissions_rate_per_sec_tons=42.2
    )

# -----------------------------------------------------------
# API Endpoints (10 New Features)
# -----------------------------------------------------------

# 1. EV Fleet Optimizer
@router.post("/ev-fleet", response_model=EVFleetResponse, tags=["Micro-Intelligence Hub"])
async def ev_fleet_optimizer(req: EVFleetRequest):
    """
    Estimates emissions reductions, battery health degradation, and grid impact for fleet electrification.
    """
    fuel_efficiency = {"Bus": 4.0, "Two-Wheeler": 50.0, "Three-Wheeler": 35.0, "Sedan": 15.0} # km/L
    fuel_eff = fuel_efficiency.get(req.vehicle_type, 15.0)
    co2_per_liter = 2.3  # kg of CO2
    fuel_cost_per_liter = 100.0  # INR
    electricity_cost_kwh = 8.0  # INR
    kwh_per_km = {"Bus": 1.2, "Two-Wheeler": 0.04, "Three-Wheeler": 0.08, "Sedan": 0.16}.get(req.vehicle_type, 0.16)
    
    total_km = req.fleet_size * req.avg_daily_km * 365
    liters_saved = total_km / fuel_eff
    annual_co2_offset = (liters_saved * co2_per_liter) / 1000.0
    
    fuel_expense = liters_saved * fuel_cost_per_liter
    electricity_expense = total_km * kwh_per_km * electricity_cost_kwh
    annual_savings = fuel_expense - electricity_expense

    charger_power = {"Bus": 80.0, "Two-Wheeler": 1.5, "Three-Wheeler": 3.0, "Sedan": 7.4}.get(req.vehicle_type, 7.4) # kW
    peak_grid_load = (req.fleet_size * charger_power * 0.3) / 1000.0 # 30% simultaneous charging factor
    
    # Battery decay based on daily mileage
    decay_pct = (req.avg_daily_km * 365 / 150000.0) * 8.0 # typical 150k km life for 80% capacity
    
    return EVFleetResponse(
        annual_co2_offset_tons=float(round(annual_co2_offset, 2)),
        annual_fuel_savings_inr=float(round(annual_savings, 2)),
        peak_grid_load_mw=float(round(peak_grid_load, 3)),
        battery_life_decay_pct_per_year=float(round(max(1.5, decay_pct), 2))
    )

# 2. Crop Yield Vulnerability Indexer
@router.post("/crop-yield", response_model=CropYieldResponse, tags=["Micro-Intelligence Hub"])
async def crop_yield_indexer(req: CropYieldRequest):
    """
    Computes a yield vulnerability index and predicts yield variations under climate anomalies.
    """
    base_vuln = {"Rice": 5.2, "Wheat": 6.5, "Sugarcane": 4.8}.get(req.crop_name, 5.0)
    
    # Simple model mapping anomalies to crop yield changes
    temp_effect = -4.5 * max(0.0, req.temperature_anomaly)
    rain_effect = -0.2 * abs(req.rainfall_anomaly_pct) if req.rainfall_anomaly_pct < 0 else 0.05 * req.rainfall_anomaly_pct
    
    predicted_change = temp_effect + rain_effect
    vuln_index = min(10.0, max(0.0, base_vuln + (req.temperature_anomaly * 1.5) + (abs(req.rainfall_anomaly_pct) * 0.05)))
    
    strategies = [
        "Transition to drought-tolerant crop varieties.",
        "Implement micro-drip irrigation to maximize water efficiency.",
        "Adjust sowing dates to avoid peak heatwaves during the flowering cycle."
    ]
    if vuln_index > 7.0:
        strategies.append("Deploy agroforestry practices to lower ambient microclimate temperatures.")
        
    return CropYieldResponse(
        crop_name=req.crop_name,
        state=req.state,
        yield_vulnerability_index=float(round(vuln_index, 2)),
        predicted_yield_change_pct=float(round(predicted_change, 2)),
        adaptation_strategies=strategies
    )

# 3. Methane Point-Source Tracker
@router.get("/methane-sources", response_model=MethaneTrackerResponse, tags=["Micro-Intelligence Hub"])
async def methane_point_source_tracker(
    region: str = Query("Delhi-NCR")
):
    """
    Simulates real-time satellite remote sensing coordinates detecting major methane point source leaks.
    """
    # Deterministic grid of hotspots
    hotspots = [
        MethaneHotspot(source_id="MET-DEL-001", source_type="Landfill", leak_rate_kg_hr=245.5, latitude=28.72, longitude=77.28, confidence_score=0.96),
        MethaneHotspot(source_id="MET-DEL-002", source_type="Rice Paddy", leak_rate_kg_hr=42.1, latitude=28.53, longitude=77.05, confidence_score=0.81),
        MethaneHotspot(source_id="MET-DEL-003", source_type="Coal Mine", leak_rate_kg_hr=580.0, latitude=28.65, longitude=77.40, confidence_score=0.98)
    ]
    if "Mumbai" in region:
        hotspots = [
            MethaneHotspot(source_id="MET-MUM-001", source_type="Landfill", leak_rate_kg_hr=310.2, latitude=19.15, longitude=72.93, confidence_score=0.95),
            MethaneHotspot(source_id="MET-MUM-002", source_type="Landfill", leak_rate_kg_hr=180.5, latitude=19.08, longitude=72.89, confidence_score=0.88)
        ]
    total_rate = sum(h.leak_rate_kg_hr for h in hotspots)
    return MethaneTrackerResponse(
        active_hotspots_found=len(hotspots),
        total_leak_rate_kg_hr=float(round(total_rate, 2)),
        hotspots=hotspots
    )

# 4. Air Quality Health Advisor
@router.get("/health-advisory", response_model=HealthAdvisoryResponse, tags=["Micro-Intelligence Hub"])
async def aqi_health_advisory(
    aqi: int = Query(180, description="Current Air Quality Index (AQI)")
):
    """
    Generates medical and activity guidelines corresponding to active pollution thresholds.
    """
    if aqi <= 50:
        cat = "Good"
        gen = "Air quality is satisfactory. Enjoy outdoor activities."
        sens = "No health precautions needed for sensitive groups."
        out = "Fully open for outdoor sports and recreational activities."
    elif aqi <= 100:
        cat = "Moderate"
        gen = "Acceptable air quality, but slight concern for highly sensitive individuals."
        sens = "Sensitive groups should consider reducing prolonged heavy outdoor exertion."
        out = "Safe for general activities; sensitive groups should take light breaks."
    elif aqi <= 200:
        cat = "Unhealthy"
        gen = "General public may begin to experience health impacts. Wear anti-pollution masks."
        sens = "Active children, adults, and people with respiratory disease should avoid outdoor exertion."
        out = "Avoid long running or high-intensity cardio outdoors. Keep windows closed."
    else:
        cat = "Hazardous"
        gen = "Serious health alert. Everyone should avoid outdoor physical activities."
        sens = "Stay indoors with air purifiers active. Mandatory usage of respirator masks if going outside is essential."
        out = "Indoor activities only. All outdoor school activities and sports events must be cancelled."

    return HealthAdvisoryResponse(
        aqi=aqi,
        health_category=cat,
        general_advisory=gen,
        sensitive_group_advisory=sens,
        outdoor_activity_recommendation=out
    )

# 5. Corporate Carbon Invoice
@router.post("/carbon-tax-invoice", response_model=CorporateCarbonInvoiceResponse, tags=["Micro-Intelligence Hub"])
async def generate_carbon_tax_invoice(req: CorporateCarbonInvoiceRequest):
    """
    Prepares a virtual corporate carbon tax statement based on energy and waste inputs.
    """
    # Emission factors
    co2_per_kwh = 0.82 / 1000.0  # tons per kWh
    co2_per_diesel_liter = 2.68 / 1000.0 # tons per liter
    co2_per_waste_ton = 0.45  # tons per ton of municipal solid waste
    
    emissions = (req.electricity_kwh * co2_per_kwh) + (req.diesel_liters * co2_per_diesel_liter) + (req.waste_tons * co2_per_waste_ton)
    # Virtual carbon price of Rs 600 per ton of CO2
    tax_due = emissions * 600.0
    
    rebates = [
        "Procure at least 30% of energy via Open Access Solar agreements to receive a 15% tax rebate.",
        "Implement on-site organic wet waste composting to zero out landfill waste emissions.",
        "Electrify diesel generator sets or switch to biofuels for heavy equipment backup."
    ]
    return CorporateCarbonInvoiceResponse(
        total_emissions_tons_co2=float(round(emissions, 2)),
        carbon_tax_due_inr=float(round(tax_due, 2)),
        rebate_qualification_pathways=rebates
    )

# 6. Water Table Stress Predictor
@router.get("/water-stress", response_model=WaterStressResponse, tags=["Micro-Intelligence Hub"])
async def water_scarcity_predictor(
    district: str = Query("Gurugram")
):
    """
    Estimates water reservoir depletion rates and projects day limits to scarcity.
    """
    # Simulated reservoir stats based on district profiles
    levels = {"Gurugram": 28.5, "Marathwada": 12.4, "Bangalore": 34.0}
    days = {"Gurugram": 45, "Marathwada": 18, "Bangalore": 62}
    
    lvl = levels.get(district, 50.0)
    day = days.get(district, 120)
    cat = "ACUTE" if day < 30 else ("MODERATE" if day < 90 else "LOW")
    
    return WaterStressResponse(
        district=district,
        current_reservoir_level_pct=lvl,
        projected_days_to_scarcity=day,
        stress_category=cat
    )

# 7. Grid Curtailment Forecaster
@router.get("/grid-curtailment", response_model=GridCurtailmentResponse, tags=["Micro-Intelligence Hub"])
async def grid_curtailment_forecaster(
    plant_name: str = Query("Bhadla Solar Park")
):
    """
    Predicts electrical grid curtailment risk (waste) due to transmission congestion.
    """
    prob = 32.5 if "Bhadla" in plant_name else 12.0
    corridor = "Western-Northern Intergrid Link v2" if "Bhadla" in plant_name else "Southern Corridor Link A"
    battery_req = 45.0 if "Bhadla" in plant_name else 10.0
    
    return GridCurtailmentResponse(
        plant_name=plant_name,
        curtailment_probability_pct=prob,
        congested_transmission_corridor=corridor,
        suggested_battery_arbitrage_capacity_mwh=battery_req
    )

# 8. Green Roof Thermal Mitigation Estimator
@router.post("/green-roofs", response_model=GreenRoofResponse, tags=["Micro-Intelligence Hub"])
async def green_roof_estimator(req: GreenRoofRequest):
    """
    Estimates cooling energy savings and structural stormwater containment from green vegetative roofs.
    """
    hvac_factor = {"Hot & Dry": 450.0, "Composite": 380.0, "Warm & Humid": 290.0}.get(req.climate_zone, 300.0) # INR saved per sqm per year
    savings = req.roof_area_sqm * hvac_factor
    temp_reduction = {"Hot & Dry": 12.5, "Composite": 10.2, "Warm & Humid": 8.0}.get(req.climate_zone, 9.0) # Celsius reduction on roof slab
    rain_retained = req.roof_area_sqm * 350.0 # 350 Liters per sqm per year
    
    return GreenRoofResponse(
        annual_hvac_savings_inr=float(round(savings, 2)),
        roof_surface_temp_reduction_celsius=temp_reduction,
        stormwater_retained_liters_per_year=float(round(rain_retained, 1))
    )

# 9. Climate Refugee Vulnerability Map
@router.get("/climate-refugees", response_model=RefugeeRiskResponse, tags=["Micro-Intelligence Hub"])
async def climate_refugee_vulnerability(
    zone_name: str = Query("Sundarbans Delta")
):
    """
    Models risk indices for coastal displacement based on sea-level rise projections.
    """
    score = 9.4 if "Sundarbans" in zone_name else 4.2
    slr = 45.2 if "Sundarbans" in zone_name else 15.0 # cm by 2050
    pop = 180000 if "Sundarbans" in zone_name else 12000
    
    return RefugeeRiskResponse(
        zone_name=zone_name,
        displacement_risk_score=score,
        sea_level_rise_projection_cm_by_2050=slr,
        vulnerable_population_count=pop
    )

# 10. Eco-Tourism Impact Assessment Tool
@router.post("/eco-tourism", response_model=EcoTourismResponse, tags=["Micro-Intelligence Hub"])
async def eco_tourism_assessor(req: EcoTourismRequest):
    """
    Scores the impact of human footprints in nature reserves and calculates funding shares.
    """
    footprint = min(10.0, float(round((req.visitor_count_per_month * 0.0005) + (100.0 - req.waste_recycled_pct) * 0.05, 2)))
    surcharge = req.visitor_count_per_month * 150.0  # Rs 150 eco-surcharge per visitor
    
    funding = {
        "Forest Patrol & Anti-Poaching": float(round(surcharge * 0.4, 2)),
        "Local Community Eco-Grants": float(round(surcharge * 0.3, 2)),
        "Waste Reclamation Infrastructure": float(round(surcharge * 0.3, 2))
    }
    
    return EcoTourismResponse(
        eco_footprint_score=footprint,
        tourism_surcharge_collected_inr=float(round(surcharge, 2)),
        conservation_project_funding_allocation=funding
    )
