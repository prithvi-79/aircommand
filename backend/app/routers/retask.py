from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.tables import EventRow, CoaRow, PlanRow, AssignmentRow, AircraftRow, BaseRow, StockRow, CrewRow, MissionRow
from backend.app.optimiser.retask import generate_courses_of_action
from backend.app.auditlog import append_audit_entry

router = APIRouter(prefix="/api/v1/retask", tags=["retask"])

class InjectEventRequest(BaseModel):
    type: str  # RUNWAY_CLOSURE, AIRCRAFT_ANOMALY, WEATHER_DEGRADATION, THREAT_SPIKE
    severity: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    payload: dict[str, Any] = {}

class ApplyCoaRequest(BaseModel):
    coa_id: str

@router.post("/inject")
def inject_disruption(req: InjectEventRequest, db: Session = Depends(get_db)):
    event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.utcnow().isoformat() + "Z"
    
    event = EventRow(
        id=event_id,
        type=req.type,
        severity=req.severity,
        effective_at=now_str,
        payload=req.payload,
        source="SCENARIO_LAB",
        status="OPEN",
    )
    db.add(event)
    
    # Fetch active plan and world snapshot
    plan = db.query(PlanRow).order_by(PlanRow.version_no.desc()).first()
    plan_dict = plan.__dict__ if plan else None
    
    snapshot = {
        "aircraft": [a.__dict__ for a in db.query(AircraftRow).all()],
        "bases": [b.__dict__ for b in db.query(BaseRow).all()],
        "missions": [m.__dict__ for m in db.query(MissionRow).all()],
        "crew": [c.__dict__ for c in db.query(CrewRow).all()],
    }
    
    coas = generate_courses_of_action(req.type, req.payload, plan_dict, snapshot)
    
    # Clear old COAs and insert new
    db.query(CoaRow).delete()
    for c in coas:
        coa_row = CoaRow(
            id=c["id"],
            event_id=event_id,
            preset=c["preset"],
            name=c["name"],
            rank=c["rank"],
            recommended=c["recommended"],
            rationale=c["rationale"],
            causal_chain=c["causal_chain"],
            metrics=c["metrics"],
            diff=c["diff"],
            assignments=[],
        )
        db.add(coa_row)
        
    append_audit_entry(
        db,
        actor="operator@projectx.local",
        action="DISRUPTION_INJECTED",
        ref=f"EVENT:{event_id}",
        diff={"type": req.type, "severity": req.severity, "payload": req.payload},
        reason=f"Scenario perturbation '{req.type}' injected into tactical environment.",
    )
    db.commit()
    
    return {
        "event": {
            "id": event.id,
            "type": event.type,
            "severity": event.severity,
            "effective_at": event.effective_at,
            "payload": event.payload,
            "status": event.status,
        },
        "coas": coas,
        "causal_chain": coas[0]["causal_chain"] if coas else {},
    }

@router.get("/events")
def get_events(db: Session = Depends(get_db)):
    events = db.query(EventRow).order_by(EventRow.effective_at.desc()).all()
    return [
        {
            "id": e.id,
            "type": e.type,
            "severity": e.severity,
            "effective_at": e.effective_at,
            "payload": e.payload,
            "status": e.status,
        }
        for e in events
    ]

@router.get("/coas")
def get_coas(db: Session = Depends(get_db)):
    coas = db.query(CoaRow).order_by(CoaRow.rank.asc()).all()
    return [
        {
            "id": c.id,
            "event_id": c.event_id,
            "preset": c.preset,
            "name": c.name,
            "rank": c.rank,
            "recommended": c.recommended,
            "rationale": c.rationale,
            "causal_chain": c.causal_chain,
            "metrics": c.metrics,
            "diff": c.diff,
        }
        for c in coas
    ]

@router.post("/apply")
def apply_coa(req: ApplyCoaRequest, db: Session = Depends(get_db)):
    coa = db.query(CoaRow).filter(CoaRow.id == req.coa_id).first()
    if not coa:
        raise HTTPException(status_code=404, detail="Course of Action not found.")
        
    event = db.query(EventRow).filter(EventRow.id == coa.event_id).first()
    if event:
        event.status = "RESOLVED"
        
    plan = db.query(PlanRow).order_by(PlanRow.version_no.desc()).first()
    if plan:
        plan.label = f"{plan.label} [COA Applied: {coa.preset}]"
        kpis = dict(plan.kpis)
        kpis["mission_fulfilment"] = coa.metrics.get("mission_fulfilment", 95.0)
        kpis["stability_score"] = coa.metrics.get("stability_score", 90.0)
        kpis["overall_readiness"] = max(20.0, kpis.get("overall_readiness", 88.0) - (coa.metrics.get("risk_score", 0.2) * 10))
        plan.kpis = kpis
        
    append_audit_entry(
        db,
        actor="commander@projectx.local",
        action="COA_APPLIED",
        ref=f"COA:{coa.id}",
        diff={"coa_preset": coa.preset, "name": coa.name, "metrics": coa.metrics},
        reason=f"Commander formally adopted {coa.name} to mitigate disruption {coa.event_id}.",
    )
    db.commit()
    
    return {
        "status": "APPLIED",
        "coa_id": coa.id,
        "event_status": "RESOLVED",
        "updated_plan_id": plan.id if plan else None,
        "causal_chain": coa.causal_chain,
    }
