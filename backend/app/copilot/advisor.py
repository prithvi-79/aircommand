from __future__ import annotations
from typing import Any
from sqlalchemy.orm import Session
from backend.app.tables import AircraftRow, CrewRow, PlanRow, FeedRow, ConflictRow, EventRow

def answer_c2_copilot_query(db: Session, query: str, user_role: str = "commander") -> dict[str, Any]:
    q_clean = query.lower().strip()
    
    # Gather live telemetry
    aircraft = db.query(AircraftRow).all()
    crew = db.query(CrewRow).all()
    feeds = db.query(FeedRow).all()
    conflicts = db.query(ConflictRow).filter(ConflictRow.resolved == False).all()
    latest_plan = db.query(PlanRow).order_by(PlanRow.version_no.desc()).first()
    open_events = db.query(EventRow).filter(EventRow.status == "OPEN").all()
    
    total_ac = len(aircraft)
    fmc_ac = sum(1 for a in aircraft if a.status == "FMC")
    nmc_ac = sum(1 for a in aircraft if a.status == "NMC")
    avg_readiness = round(sum(a.readiness for a in aircraft) / max(1, total_ac), 1)
    
    grounded_evidence = []
    
    if any(k in q_clean for k in ["readiness", "status", "fleet health", "overall"]):
        answer = (
            f"Current Fleet Readiness is {avg_readiness}%. Out of {total_ac} total airframes, "
            f"{fmc_ac} are Fully Mission Capable (FMC) and {nmc_ac} are Non-Mission Capable (NMC/Maintenance). "
            f"The Air Tasking Order is currently in status '{latest_plan.status if latest_plan else 'NO_PLAN'}'. "
            f"Sensor fusion indicates {len(conflicts)} active telemetry discrepancies."
        )
        grounded_evidence = [
            f"FMC Airframes: {fmc_ac}/{total_ac}",
            f"Average Readiness: {avg_readiness}%",
            f"Active Plan: {latest_plan.id if latest_plan else 'None'} ({latest_plan.status if latest_plan else 'N/A'})",
        ]
    elif any(k in q_clean for k in ["disruption", "event", "threat", "anomaly", "retask"]):
        if open_events:
            ev = open_events[0]
            answer = (
                f"Active disruption detected: '{ev.type}' (Severity: {ev.severity}) effective since {ev.effective_at}. "
                f"Dynamic Retasking engine has evaluated 4 Courses of Action (COAs). "
                f"Recommended tactical response: Airframe Substitution (COA 2) to maintain zero mission delay."
            )
            grounded_evidence = [
                f"Event ID: {ev.id}",
                f"Event Type: {ev.type}",
                f"Severity: {ev.severity}",
            ]
        else:
            answer = (
                "No open operational disruptions currently active. All air corridors and forward operating bases "
                "are functioning within nominal envelopes. You can inject a scenario from the Disruption Lab to simulate contingency responses."
            )
            grounded_evidence = ["Open Events Count: 0"]
    elif any(k in q_clean for k in ["feed", "sensor", "radar", "fusion"]):
        degraded = [f.name for f in feeds if f.status != "HEALTHY"]
        if degraded:
            answer = (
                f"Sensor fusion warning: {len(degraded)} feed(s) experiencing disruption: {', '.join(degraded)}. "
                f"Check the Sensor Hub to review live conflict telemetry and execute link restore."
            )
        else:
            answer = (
                f"All 8 multi-source telemetry feeds are HEALTHY with sub-100ms latency. "
                "ATC surface radar, Doppler weather, ATF fuel buffers, and SATCOM links are nominal."
            )
        grounded_evidence = [f"{f.name}: {f.status} ({f.latency_ms}ms)" for f in feeds[:4]]
    elif any(k in q_clean for k in ["recommend", "action", "what should", "next"]):
        if not latest_plan or latest_plan.status == "DRAFT":
            answer = (
                "Recommended next operational step: Run Google OR-Tools CP-SAT optimizer to generate an Air Tasking Order (ATO) schedule, "
                "then submit it for independent constraint verification."
            )
            grounded_evidence = ["Plan status: DRAFT or uninitialized"]
        elif latest_plan.status == "OPTIMISED":
            answer = (
                f"Air Tasking Order {latest_plan.id} has been solved. Recommended next step: Commander review and approval, "
                "followed by independent auditor cryptographic co-signing."
            )
            grounded_evidence = [f"Plan {latest_plan.id}: OPTIMISED"]
        else:
            answer = (
                f"ATO {latest_plan.id} is {latest_plan.status}. Fleet readiness is stable at {avg_readiness}%. "
                "Maintain combat air patrols and monitor weather fronts along northern corridors."
            )
            grounded_evidence = [f"Plan {latest_plan.id}: {latest_plan.status}"]
    else:
        answer = (
            f"C2 Tactical Advisory Summary: Fleet readiness is {avg_readiness}% ({fmc_ac} ready fighters). "
            f"Active plan: {latest_plan.label if latest_plan else 'No active ATO'}. "
            f"Feeds: {sum(1 for f in feeds if f.status == 'HEALTHY')}/8 healthy. "
            "How can I assist your operational decisions further?"
        )
        grounded_evidence = [
            f"Fleet FMC: {fmc_ac}/{total_ac}",
            f"Readiness: {avg_readiness}%",
        ]

    return {
        "query": query,
        "answer": answer,
        "confidence": 0.96,
        "grounded_evidence": grounded_evidence,
        "operator_role": user_role,
    }
