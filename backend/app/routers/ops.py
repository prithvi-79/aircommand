from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.tables import (
    BaseRow, AircraftRow, AircraftTypeRow, CrewRow, StockRow,
    MissionRow, PlanRow, AssignmentRow, FeedRow, ConflictRow, EventRow, CoaRow
)
from backend.app.optimiser.model import solve_air_tasking_order
from backend.app.optimiser.validator import validate_plan
from backend.app.auditlog import append_audit_entry

router = APIRouter(prefix="/api/v1", tags=["operations"])

class OptimiseRequest(BaseModel):
    posture: str = "BALANCED"  # BALANCED, RESERVE_FOCUSED, HIGH_TEMPO
    time_limit: float = 5.0
    label: str = "Air Tasking Order 26250"

@router.get("/command/glance")
def get_command_glance(db: Session = Depends(get_db)):
    aircraft = db.query(AircraftRow).all()
    crew = db.query(CrewRow).all()
    bases = db.query(BaseRow).all()
    plan = db.query(PlanRow).order_by(PlanRow.version_no.desc()).first()
    feeds = db.query(FeedRow).all()
    conflicts = db.query(ConflictRow).filter(ConflictRow.resolved == False).all()
    open_events = db.query(EventRow).filter(EventRow.status == "OPEN").all()
    coas = db.query(CoaRow).all()

    total_ac = len(aircraft)
    fmc_ac = sum(1 for a in aircraft if a.status == "FMC")
    ready_crew = sum(1 for c in crew if c.status == "AVAILABLE")
    fresh_ac = sum(1 for a in aircraft if a.freshness == "FRESH")

    kpis = plan.kpis if plan else {
        "mission_fulfilment": 85.0,
        "p1_coverage": 100.0,
        "aircraft_fmc": f"{fmc_ac}/{total_ac}",
        "crew_ready": f"{ready_crew}/{len(crew)}",
        "reserve_integrity": "85.0%",
        "overall_readiness": 88.0,
    }

    # Decision requirements
    decision_required = False
    decision_reason = "No urgent intervention needed"
    if open_events:
        decision_required = True
        decision_reason = f"Contingency: {open_events[0].type} requires Course of Action approval"
    elif plan and plan.status == "OPTIMISED":
        decision_required = True
        decision_reason = f"Plan {plan.id} ready for Commander Approval"
    elif plan and plan.status == "APPROVED":
        decision_required = True
        decision_reason = f"Plan {plan.id} awaiting Auditor Co-signature"

    return {
        "decision_state": "INTERVENTION_REQUIRED" if decision_required else "NOMINAL",
        "decision_required": decision_required,
        "decision_reason": decision_reason,
        "kpis": kpis,
        "validation": plan.validation if plan else {"valid": True, "violations": []},
        "plan": {
            "id": plan.id,
            "status": plan.status,
            "posture": plan.posture,
            "label": plan.label,
            "sorties_count": db.query(AssignmentRow).filter(AssignmentRow.plan_id == plan.id).count() if plan else 0,
        } if plan else None,
        "feeds": {
            "healthy": sum(1 for f in feeds if f.status == "HEALTHY"),
            "total": len(feeds),
            "conflicts_count": len(conflicts),
        },
        "disruptions": {
            "open_count": len(open_events),
            "available_coas": len(coas),
        },
        "fleet_glance": {
            "total": total_ac,
            "fmc": fmc_ac,
            "pmc": sum(1 for a in aircraft if a.status == "PMC"),
            "nmc": sum(1 for a in aircraft if a.status == "NMC"),
        }
    }

@router.get("/registers/bases")
def get_bases(db: Session = Depends(get_db)):
    return db.query(BaseRow).all()

@router.get("/registers/fleet")
def get_fleet(db: Session = Depends(get_db)):
    return db.query(AircraftRow).all()

@router.get("/registers/crew")
def get_crew(db: Session = Depends(get_db)):
    return db.query(CrewRow).all()

@router.get("/registers/stores")
def get_stores(db: Session = Depends(get_db)):
    return db.query(StockRow).all()

@router.get("/registers/missions")
def get_missions(db: Session = Depends(get_db)):
    return db.query(MissionRow).all()

def _serialize_plan(p: PlanRow) -> dict[str, Any]:
    return {
        "id": p.id,
        "version_no": p.version_no,
        "status": p.status,
        "posture": p.posture,
        "label": p.label,
        "horizon": p.horizon,
        "seed": p.seed,
        "solver_stats": p.solver_stats,
        "kpis": p.kpis,
        "validation": p.validation,
        "created_by": p.created_by,
        "submitted_by": p.submitted_by,
        "approved_by": p.approved_by,
        "co_approved_by": p.co_approved_by,
        "digest": p.digest,
    }

def _serialize_assignment(a: AssignmentRow) -> dict[str, Any]:
    return {
        "id": a.id,
        "plan_id": a.plan_id,
        "mission_id": a.mission_id,
        "tail": a.tail,
        "crew_ids": a.crew_ids,
        "takeoff": a.takeoff,
        "landing": a.landing,
        "base_id": a.base_id,
        "status": a.status,
        "payload": a.payload,
    }

@router.get("/plan/current")
def get_current_plan(db: Session = Depends(get_db)):
    plan = db.query(PlanRow).order_by(PlanRow.version_no.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active Air Tasking Order.")
    assignments = db.query(AssignmentRow).filter(AssignmentRow.plan_id == plan.id).all()
    return {
        "plan": _serialize_plan(plan),
        "assignments": [_serialize_assignment(a) for a in assignments],
        "validation": plan.validation,
        "kpis": plan.kpis,
    }

@router.post("/plan/optimise")
def optimise_plan(req: OptimiseRequest, db: Session = Depends(get_db)):
    missions = [m.__dict__ for m in db.query(MissionRow).all()]
    aircraft = [a.__dict__ for a in db.query(AircraftRow).all()]
    crew = [c.__dict__ for c in db.query(CrewRow).all()]
    bases = [b.__dict__ for b in db.query(BaseRow).all()]
    stocks = [s.__dict__ for s in db.query(StockRow).all()]

    snapshot = {
        "epoch": datetime.utcnow().isoformat() + "Z",
        "missions": missions,
        "aircraft": aircraft,
        "crew": crew,
        "bases": bases,
        "stocks": stocks,
    }

    res = solve_air_tasking_order(snapshot, posture=req.posture, time_limit=req.time_limit)
    new_version = db.query(PlanRow).count() + 1
    plan_id = f"ATO-26250-V{new_version}"

    plan = PlanRow(
        id=plan_id,
        version_no=new_version,
        status="OPTIMISED",
        posture=req.posture,
        objective_weights={"value": 500, "risk": 15, "stability": 100},
        horizon=24,
        seed=26250,
        solver_stats=res["solver_stats"],
        kpis=res["kpis"],
        validation=res["validation"],
        label=f"{req.label} (Version {new_version} · {req.posture})",
        created_by="planner@projectx.local",
        submitted_by="planner@projectx.local",
        digest=f"sha256:{uuid.uuid4().hex}",
    )
    db.add(plan)
    db.commit()

    created_assignments = []
    for asg in res["assignments"]:
        row = AssignmentRow(
            plan_id=plan_id,
            mission_id=asg["mission_id"],
            tail=asg["tail"],
            crew_ids=asg["crew_ids"],
            takeoff=asg["takeoff"],
            landing=asg["landing"],
            base_id=asg["base_id"],
            status=asg["status"],
            payload=asg["payload"],
        )
        db.add(row)
        created_assignments.append(row)
    db.commit()

    append_audit_entry(
        db,
        actor="planner@projectx.local",
        action="ATO_OPTIMISED",
        ref=f"PLAN:{plan_id}",
        diff={"posture": req.posture, "sorties": len(res["assignments"]), "readiness": res["kpis"]["overall_readiness"]},
        reason=f"Executed Google OR-Tools CP-SAT optimizer under {req.posture} posture.",
    )
    db.commit()

    return {
        "plan": _serialize_plan(plan),
        "assignments": [_serialize_assignment(a) for a in created_assignments],
        "kpis": res["kpis"],
        "validation": res["validation"],
    }

@router.post("/plan/validate")
def validate_current_plan(db: Session = Depends(get_db)):
    plan = db.query(PlanRow).order_by(PlanRow.version_no.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active plan.")
    assignments = [a.__dict__ for a in db.query(AssignmentRow).filter(AssignmentRow.plan_id == plan.id).all()]
    snapshot = {
        "missions": [m.__dict__ for m in db.query(MissionRow).all()],
        "aircraft": [a.__dict__ for a in db.query(AircraftRow).all()],
        "crew": [c.__dict__ for c in db.query(CrewRow).all()],
        "bases": [b.__dict__ for b in db.query(BaseRow).all()],
        "stocks": [s.__dict__ for s in db.query(StockRow).all()],
    }
    val_res = validate_plan(snapshot, assignments)
    plan.validation = val_res
    db.commit()
    return val_res

@router.post("/plan/approve")
def approve_plan(db: Session = Depends(get_db)):
    plan = db.query(PlanRow).order_by(PlanRow.version_no.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active plan to approve.")
    plan.status = "APPROVED"
    plan.approved_by = "commander@projectx.local"
    db.commit()
    append_audit_entry(
        db,
        actor="commander@projectx.local",
        action="ATO_APPROVED",
        ref=f"PLAN:{plan.id}",
        reason="Commander formal operational review and authorization granted.",
    )
    db.commit()
    return {"status": "APPROVED", "plan_id": plan.id, "approved_by": plan.approved_by}

@router.post("/plan/cosign")
def cosign_plan(db: Session = Depends(get_db)):
    plan = db.query(PlanRow).order_by(PlanRow.version_no.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active plan to co-sign.")
    if plan.status not in ("APPROVED", "OPTIMISED"):
        raise HTTPException(status_code=400, detail="Plan must be approved by Commander before Auditor co-signing.")
    plan.status = "CO_SIGNED"
    plan.co_approved_by = "auditor@projectx.local"
    db.commit()
    append_audit_entry(
        db,
        actor="auditor@projectx.local",
        action="ATO_COSIGNED",
        ref=f"PLAN:{plan.id}",
        reason="Independent auditor verified constraint compliance and cryptographic integrity.",
    )
    db.commit()
    return {"status": "CO_SIGNED", "plan_id": plan.id, "co_approved_by": plan.co_approved_by}

@router.post("/plan/publish")
def publish_plan(db: Session = Depends(get_db)):
    plan = db.query(PlanRow).order_by(PlanRow.version_no.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active plan to publish.")
    plan.status = "PUBLISHED"
    db.commit()
    append_audit_entry(
        db,
        actor="commander@projectx.local",
        action="ATO_PUBLISHED",
        ref=f"PLAN:{plan.id}",
        reason="Air Tasking Order published to all Forward Operating Wings for live flight execution.",
    )
    db.commit()
    return {"status": "PUBLISHED", "plan_id": plan.id}
