from __future__ import annotations
from typing import Any
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.tables import AircraftRow, ConflictRow
from backend.app.ml_service.predictor import MLPredictor

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

class RiskAnalysisRequest(BaseModel):
    fuel_level: float = 85.0
    fuel_consumption_rate: float = 38.0
    engine_temperature: float = 735.0
    engine_health: float = 94.0
    aircraft_health: float = 92.0
    mission_priority: int = 1
    operational_condition: int = 1
    maintenance_state: int = 0
    operational_load: float = 65.0

@router.get("/aircraft-degradation")
def get_aircraft_degradation(
    tail: str = Query("RB-001"),
    curr_readiness: float | None = Query(None),
    engine_health: float | None = Query(None),
    engine_temperature: float | None = Query(None),
    flight_hours: float | None = Query(None),
    db: Session = Depends(get_db),
):
    ac = db.query(AircraftRow).filter(AircraftRow.tail == tail).first()
    
    r = curr_readiness if curr_readiness is not None else (ac.readiness if ac else 94.0)
    eh = engine_health if engine_health is not None else (ac.engine_health if ac else 96.0)
    et = engine_temperature if engine_temperature is not None else (ac.engine_temp if ac else 730.0)
    fh = flight_hours if flight_hours is not None else (ac.flight_hours if ac else 320.0)
    
    pred = MLPredictor.predict_aircraft_degradation(r, eh, et, fh)
    pred["tail"] = tail
    pred["aircraft_type"] = ac.type_id if ac else "RAFALE"
    pred["current_engine_temp"] = et
    pred["current_engine_health"] = eh
    return pred

@router.get("/fleet-forecast")
def get_fleet_readiness_forecast(db: Session = Depends(get_db)):
    aircraft = db.query(AircraftRow).all()
    conflicts = db.query(ConflictRow).filter(ConflictRow.resolved == False).all()
    
    total_ac = len(aircraft)
    fmc_ac = sum(1 for a in aircraft if a.status == "FMC")
    ac_ratio = (fmc_ac / max(1, total_ac))
    avg_r = sum(a.readiness for a in aircraft) / max(1, total_ac)
    
    return MLPredictor.predict_fleet_readiness(
        curr_readiness=round(avg_r, 1),
        ac_ready_ratio=round(ac_ratio, 2),
        crew_avail_ratio=0.88,
        res_health=93.5,
        weather_index=0.12,
        constraints_count=len(conflicts),
    )

@router.post("/operational-risk")
def evaluate_operational_risk(req: RiskAnalysisRequest):
    features = req.dict()
    return MLPredictor.predict_operational_risk(features)
