from __future__ import annotations
from typing import Any

def generate_causal_chain(event_type: str, details: dict[str, Any], baseline_kpis: dict[str, Any]) -> dict[str, Any]:
    """
    Computes grounded causal impact chains:
    What Changed -> What Was Affected -> Why -> Resulting Impact
    plus before/after diffs of readiness, constraint count, and risk index.
    """
    if event_type == "RUNWAY_CLOSURE":
        base_name = details.get("base_name", "Forward Operating Base")
        runway_id = details.get("runway", "09L/27R")
        what_changed = f"Runway {runway_id} at {base_name} rendered non-operational due to unexploded ordnance / cratering."
        what_affected = f"All scheduled ingress and egress sorties at {base_name}; launch and recovery rates dropped to 0."
        why = "Runway closure breaches safety criteria for jet fighter takeoff and recovery envelopes."
        resulting_impact = "Forces immediate diversion of airborne sorties and re-routing of follow-on packages to alternate wings."
        readiness_delta = -14.5
        risk_delta = +0.28
        new_constraints = 3
    elif event_type == "AIRCRAFT_ANOMALY":
        tail = details.get("tail", "SU-30-01")
        anomaly = details.get("anomaly", "Turbine stage 2 thermal surge (842°C)")
        what_changed = f"Aircraft {tail} reported critical in-flight anomaly: {anomaly}."
        what_affected = f"Primary fighter element on Sector North CAP patrol and coordinated escort wing."
        why = "High engine temperature risks catastrophic compressor stall and requires immediate abort."
        resulting_impact = "Airframe marked NMC, scramble of reserve ready airframe authorized, tactical patrol gap created."
        readiness_delta = -8.0
        risk_delta = +0.19
        new_constraints = 2
    elif event_type == "WEATHER_DEGRADATION":
        base_name = details.get("base_name", "Ambala AFS")
        what_changed = f"Convective thunderstorm cell formed over {base_name}; crosswinds spiked to 36 knots, ceiling dropped to 200 ft."
        what_affected = f"Terminal approach corridors and scheduled takeoff windows for 4 multirole fighter sorties."
        why = "Crosswinds and low cloud ceiling violate fighter instrument recovery minimums (max allowable crosswind 28kt)."
        resulting_impact = "Mandates holding pattern in designated safe air space or tactical weather rerouting."
        readiness_delta = -11.0
        risk_delta = +0.22
        new_constraints = 4
    elif event_type == "THREAT_SPIKE":
        zone = details.get("zone", "Northern Border Sector")
        what_changed = f"High-altitude enemy SAM radar lock and fighter activity detected in {zone}."
        what_affected = f"Direct flight corridors 12 and 14; planned recon and strike routes compromised."
        why = "Threat exposure index exceeds permissible risk threshold for unescorted missions."
        resulting_impact = "Rerouting around standoff threat ring, additional SEAD / escort fighter requirements added."
        readiness_delta = -9.5
        risk_delta = +0.35
        new_constraints = 2
    else:
        what_changed = f"Operational contingency event '{event_type}' injected into tactical environment."
        what_affected = "Scheduled sorties and forward logistics buffers."
        why = "Physical or operational parameters shifted outside baseline envelope."
        resulting_impact = "Requires dynamic retasking and course of action re-ranking."
        readiness_delta = -6.0
        risk_delta = +0.15
        new_constraints = 1

    base_r = float(baseline_kpis.get("overall_readiness", 88.0))
    sim_r = max(20.0, round(base_r + readiness_delta, 1))
    
    return {
        "what_changed": what_changed,
        "what_affected": what_affected,
        "why": why,
        "resulting_impact": resulting_impact,
        "baseline_readiness": base_r,
        "simulated_readiness": sim_r,
        "readiness_delta": round(sim_r - base_r, 1),
        "risk_delta": risk_delta,
        "additional_constraints": new_constraints,
        "timeline": [
            {"step": 1, "label": "Perturbation Detected", "detail": what_changed},
            {"step": 2, "label": "Propagation & Impact", "detail": what_affected},
            {"step": 3, "label": "Root Cause Rule", "detail": why},
            {"step": 4, "label": "System State Shift", "detail": resulting_impact},
        ]
    }
