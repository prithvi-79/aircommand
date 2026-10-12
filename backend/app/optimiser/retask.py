from __future__ import annotations
import uuid
from typing import Any
from backend.app.optimiser.causal_chain import generate_causal_chain
from backend.app.ml_service.predictor import MLPredictor

def generate_courses_of_action(
    event_type: str,
    event_payload: dict[str, Any],
    current_plan: dict[str, Any] | None,
    snapshot: dict[str, Any],
) -> list[dict[str, Any]]:
    baseline_kpis = current_plan.get("kpis", {}) if current_plan else {"overall_readiness": 88.0}
    causal_info = generate_causal_chain(event_type, event_payload, baseline_kpis)
    
    aircraft = snapshot.get("aircraft", [])
    ready_reserves = [a["tail"] for a in aircraft if a.get("status") == "FMC"]
    reserve_tail = ready_reserves[0] if ready_reserves else "IAF-RES-01"
    
    # 4 Ranked Courses of Action
    coa_list = [
        {
            "id": f"COA-{uuid.uuid4().hex[:6].upper()}-A",
            "preset": "MINIMAL_CHANGE",
            "name": "COA 1: Schedule Padding & Minor Delay",
            "rank": 2,
            "recommended": False,
            "rationale": "Retains current airframe allocations while shifting takeoff windows by +45 minutes to bypass peak disruption. High schedule stability.",
            "metrics": {
                "stability_score": 96.0,
                "risk_score": 0.28,
                "mission_fulfilment": 92.0,
                "time_penalty_min": 45,
            },
            "diff": [
                {"action": "RETIME", "detail": "Delay Sector North CAP takeoff by +45m until cloud ceiling improves"},
                {"action": "HOLD", "detail": "Keep reserve alert-5 fighters on 15m standby"},
            ],
            "causal_chain": causal_info,
        },
        {
            "id": f"COA-{uuid.uuid4().hex[:6].upper()}-B",
            "preset": "SUBSTITUTION",
            "name": "COA 2: Airframe Substitution (Recommended)",
            "rank": 1,
            "recommended": True,
            "rationale": f"Immediately substitute impaired airframe with standby reserve tail {reserve_tail}. Preserves exact time-on-target with zero mission delay.",
            "metrics": {
                "stability_score": 88.0,
                "risk_score": 0.12,
                "mission_fulfilment": 100.0,
                "time_penalty_min": 0,
            },
            "diff": [
                {"action": "SUBSTITUTE", "detail": f"Assign fresh reserve airframe {reserve_tail} to active mission"},
                {"action": "MAINTENANCE", "detail": "Route original aircraft to technical bay for diagnostic teardown"},
            ],
            "causal_chain": causal_info,
        },
        {
            "id": f"COA-{uuid.uuid4().hex[:6].upper()}-C",
            "preset": "DIVERSION",
            "name": "COA 3: Tactical Base Diversion",
            "rank": 3,
            "recommended": False,
            "rationale": "Divert incoming flight package to Halwara AFS recovery runway. Evades closed runway while maintaining air superiority.",
            "metrics": {
                "stability_score": 75.0,
                "risk_score": 0.22,
                "mission_fulfilment": 95.0,
                "time_penalty_min": 25,
            },
            "diff": [
                {"action": "DIVERT", "detail": "Re-vector recovery approach to runway 13 at Halwara AFS"},
                {"action": "FUEL_BURN", "detail": "Consumes additional 650kg ATF buffer for transit leg"},
            ],
            "causal_chain": causal_info,
        },
        {
            "id": f"COA-{uuid.uuid4().hex[:6].upper()}-D",
            "preset": "ROBUST_SCRAMBLE",
            "name": "COA 4: Quick-Reaction Alert Scramble",
            "rank": 4,
            "recommended": False,
            "rationale": "Scramble dual-fighter quick reaction package from Bareilly AFS with maximum engine afterburners. Highest tempo, higher fuel expenditure.",
            "metrics": {
                "stability_score": 62.0,
                "risk_score": 0.35,
                "mission_fulfilment": 100.0,
                "time_penalty_min": -10,
            },
            "diff": [
                {"action": "SCRAMBLE", "detail": "Authorize immediate emergency takeoff of Alert-1 dual-ship pair"},
                {"action": "RESERVE_RELEASE", "detail": "Releases secondary wing interceptors from defensive holding reserve"},
            ],
            "causal_chain": causal_info,
        },
    ]
    
    return coa_list
