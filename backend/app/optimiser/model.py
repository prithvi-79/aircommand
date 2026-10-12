from __future__ import annotations
import time
from datetime import datetime, timedelta
from typing import Any
from ortools.sat.python import cp_model
from backend.app.optimiser.timeutil import parse_iso, to_iso, add_minutes
from backend.app.optimiser.validator import validate_plan

def solve_air_tasking_order(
    snapshot: dict[str, Any],
    posture: str = "BALANCED",
    time_limit: float = 5.0,
    seed: int = 26250,
) -> dict[str, Any]:
    started = time.perf_counter()
    missions = snapshot.get("missions", [])
    aircraft = [a for a in snapshot.get("aircraft", []) if a.get("status") in ("FMC", "PMC")]
    crew = [c for c in snapshot.get("crew", []) if c.get("status") in ("AVAILABLE", "FRESH")]
    bases = {b["id"]: b for b in snapshot.get("bases", [])}
    
    if not missions or not aircraft or not crew:
        return {
            "assignments": [],
            "kpis": {
                "mission_fulfilment": 0.0,
                "p1_coverage": 0.0,
                "aircraft_fmc": f"0/{len(snapshot.get('aircraft', []))}",
                "crew_ready": f"0/{len(snapshot.get('crew', []))}",
                "reserve_integrity": "100%",
                "overall_readiness": 50.0,
            },
            "solver_stats": {"status": "NO_DATA", "solve_time_sec": 0.0},
            "validation": {"valid": True, "violations": [], "status": "PASS"},
        }

    model = cp_model.CpModel()
    
    # Decision variables: x[m_idx, a_idx] = 1 if aircraft a assigned to mission m
    x: dict[tuple[int, int], cp_model.IntVar] = {}
    for m_idx, m in enumerate(missions):
        for a_idx, a in enumerate(aircraft):
            x[m_idx, a_idx] = model.new_bool_var(f"x_{m_idx}_{a_idx}")

    # Aircraft capacity: each aircraft can fly at most 1 primary sortie in this planning horizon
    for a_idx in range(len(aircraft)):
        model.add(sum(x[m_idx, a_idx] for m_idx in range(len(missions))) <= 1)

    # Mission requirements: each mission requires aircraft_required
    mission_covered: list[cp_model.IntVar] = []
    for m_idx, m in enumerate(missions):
        req = max(1, m.get("aircraft_required", 2))
        assigned_sum = sum(x[m_idx, a_idx] for a_idx in range(len(aircraft)))
        covered_var = model.new_bool_var(f"cov_{m_idx}")
        model.add(assigned_sum >= req).only_enforce_if(covered_var)
        model.add(assigned_sum < req).only_enforce_if(covered_var.negated())
        mission_covered.append(covered_var)

    # Posture parameters
    obj_terms = []
    for m_idx, m in enumerate(missions):
        prio = m.get("priority", 2)
        weight = 500 if prio == 1 else 250 if prio == 2 else 100
        obj_terms.append(mission_covered[m_idx] * weight)

    if posture == "RESERVE_FOCUSED":
        # Leave reserve margin: limit assigned aircraft count to at most 70% of available fleet
        max_assign = max(1, int(len(aircraft) * 0.70))
        model.add(sum(x[m_idx, a_idx] for m_idx in range(len(missions)) for a_idx in range(len(aircraft))) <= max_assign)
    elif posture == "HIGH_TEMPO":
        # Strongly incentivize covering every mission
        for m_idx in range(len(missions)):
            obj_terms.append(mission_covered[m_idx] * 500)

    model.maximize(sum(obj_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit
    solver.parameters.random_seed = seed
    status = solver.solve(model)
    solve_duration = round(time.perf_counter() - started, 3)

    assignments: list[dict[str, Any]] = []
    crew_pool = list(crew)
    crew_idx = 0
    assigned_tails = set()

    base_time = parse_iso(snapshot.get("epoch", datetime.utcnow().isoformat()))

    for m_idx, m in enumerate(missions):
        req = max(1, m.get("aircraft_required", 2))
        dur_min = m.get("duration_min", 90)
        start_dt = base_time + timedelta(minutes=(m_idx * 45))
        end_dt = start_dt + timedelta(minutes=dur_min)
        
        assigned_to_m = []
        for a_idx, a in enumerate(aircraft):
            if solver.value(x[m_idx, a_idx]) == 1:
                assigned_to_m.append(a)

        # Fallback greedy assignment if CP-SAT was unfeasible or unassigned due to limits
        if not assigned_to_m:
            for a in aircraft:
                if a["tail"] not in assigned_tails:
                    assigned_to_m.append(a)
                    if len(assigned_to_m) >= req:
                        break

        for a in assigned_to_m:
            assigned_tails.add(a["tail"])
            assigned_crew_ids = []
            req_crew = max(1, m.get("crew_required", 1))
            for _ in range(req_crew):
                if crew_pool:
                    assigned_crew_ids.append(crew_pool[crew_idx % len(crew_pool)]["id"])
                    crew_idx += 1

            assignments.append({
                "mission_id": m["id"],
                "tail": a["tail"],
                "crew_ids": assigned_crew_ids,
                "takeoff": to_iso(start_dt),
                "landing": to_iso(end_dt),
                "base_id": a.get("base_id", m.get("base_id", "AMBALA-AFS")),
                "status": "ASSIGNED",
                "payload": {
                    "mission_name": m.get("name", m["id"]),
                    "aircraft_type": a.get("type_id", "SU-30MKI"),
                    "payload_class": m.get("payload_class", "BVR-AAM"),
                }
            })

    # Validate the generated schedule
    validation_res = validate_plan(snapshot, assignments)

    covered_m_count = len({asg["mission_id"] for asg in assignments})
    p1_total = sum(1 for m in missions if m.get("priority") == 1)
    p1_covered = len({asg["mission_id"] for asg in assignments if any(m["id"] == asg["mission_id"] and m.get("priority") == 1 for m in missions)})
    
    fulfilment_pct = round((covered_m_count / max(1, len(missions))) * 100, 1)
    p1_pct = round((p1_covered / max(1, p1_total)) * 100, 1) if p1_total > 0 else 100.0
    reserve_pct = round(((len(aircraft) - len(assigned_tails)) / max(1, len(aircraft))) * 100, 1)
    overall_readiness = round(85.0 + (fulfilment_pct * 0.1) - (len(validation_res["violations"]) * 5), 1)

    return {
        "assignments": assignments,
        "posture": posture,
        "kpis": {
            "mission_fulfilment": fulfilment_pct,
            "p1_coverage": p1_pct,
            "aircraft_fmc": f"{len(assigned_tails)}/{len(aircraft)}",
            "crew_ready": f"{min(len(crew), len(assignments))}/{len(crew)}",
            "reserve_integrity": f"{reserve_pct}%",
            "overall_readiness": max(20.0, min(99.0, overall_readiness)),
        },
        "solver_stats": {
            "status": "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE" if status == cp_model.FEASIBLE else "GREEDY_FALLBACK",
            "solve_time_sec": solve_duration,
            "missions_covered": covered_m_count,
            "sorties_count": len(assignments),
        },
        "validation": validation_res,
    }
