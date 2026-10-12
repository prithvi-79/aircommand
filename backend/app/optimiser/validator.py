from __future__ import annotations
from collections import defaultdict
from typing import Any
from backend.app.optimiser.timeutil import parse_iso, minutes_between

def validate_plan(snapshot: dict[str, Any], assignments: list[dict[str, Any]]) -> dict[str, Any]:
    violations: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    
    aircraft_map = {a["tail"]: a for a in snapshot.get("aircraft", [])}
    crew_map = {c["id"]: c for c in snapshot.get("crew", [])}
    base_map = {b["id"]: b for b in snapshot.get("bases", [])}
    mission_map = {m["id"]: m for m in snapshot.get("missions", [])}
    stock_map = {(s["base_id"], s["code"]): s for s in snapshot.get("stocks", [])}
    
    tail_sorties = defaultdict(list)
    crew_sorties = defaultdict(list)
    base_launch_slots = defaultdict(int)
    base_recovery_slots = defaultdict(int)
    stock_consumed = defaultdict(int)

    for assign in assignments:
        tail = assign.get("tail")
        mission_id = assign.get("mission_id")
        m_info = mission_map.get(mission_id, {})
        m_name = m_info.get("name", mission_id)
        
        takeoff_dt = parse_iso(assign.get("takeoff", ""))
        landing_dt = parse_iso(assign.get("landing", ""))
        
        # 1. Aircraft checks
        ac = aircraft_map.get(tail)
        if not ac:
            violations.append({
                "rule": "AIRCRAFT_UNKNOWN",
                "severity": "CRITICAL",
                "message": f"Tail {tail} is not in active registry.",
            })
        else:
            if ac.get("status") in ("NMC", "GROUNDED", "MAINTENANCE"):
                violations.append({
                    "rule": "AIRCRAFT_UNSERVICEABLE",
                    "severity": "CRITICAL",
                    "message": f"Aircraft {tail} is currently {ac.get('status')} and cannot be tasked.",
                })
            if ac.get("hours_to_inspection", 100) < 5.0:
                warnings.append({
                    "rule": "INSPECTION_WINDOW_TIGHT",
                    "severity": "WARNING",
                    "message": f"Aircraft {tail} has only {ac.get('hours_to_inspection')}h until mandatory phase inspection.",
                })

        tail_sorties[tail].append((takeoff_dt, landing_dt, mission_id))
        
        # 2. Crew checks
        for c_id in assign.get("crew_ids", []):
            cr = crew_map.get(c_id)
            if not cr:
                violations.append({
                    "rule": "CREW_UNKNOWN",
                    "severity": "CRITICAL",
                    "message": f"Crew member {c_id} assigned to {m_name} is not in registry.",
                })
            else:
                if cr.get("status") in ("UNAVAILABLE", "HOSPITAL", "REST"):
                    violations.append({
                        "rule": "CREW_UNAVAILABLE",
                        "severity": "CRITICAL",
                        "message": f"Aircrew {cr.get('name', c_id)} is marked {cr.get('status')} (mandatory rest/unfit).",
                    })
                flight_dur_hr = max(1.0, minutes_between(takeoff_dt, landing_dt) / 60.0)
                tot_24h = cr.get("hours_24h", 0.0) + flight_dur_hr
                if tot_24h > 8.0:
                    violations.append({
                        "rule": "CREW_DUTY_EXCEEDED",
                        "severity": "HIGH",
                        "message": f"Aircrew {cr.get('name', c_id)} exceeds 8h 24-hour duty ceiling ({tot_24h:.1f}h).",
                    })
                elif tot_24h > 6.0:
                    warnings.append({
                        "rule": "CREW_FATIGUE_ELEVATED",
                        "severity": "WARNING",
                        "message": f"Aircrew {cr.get('name', c_id)} approaching duty limit ({tot_24h:.1f}h in 24h).",
                    })
            crew_sorties[c_id].append((takeoff_dt, landing_dt, mission_id))

        # 3. Base runway slot capacity
        base_id = assign.get("base_id") or (ac.get("base_id") if ac else None)
        base = base_map.get(base_id)
        if base:
            # Check weather minimums
            weather = base.get("weather", {})
            if weather.get("crosswind_knots", 0) > 28:
                violations.append({
                    "rule": "BASE_WEATHER_LIMIT",
                    "severity": "CRITICAL",
                    "message": f"Base {base.get('name', base_id)} crosswind {weather.get('crosswind_knots')}kt exceeds safety limit (28kt).",
                })
            # 15-minute slot key
            t_slot = (base_id, takeoff_dt.strftime("%Y-%m-%d %H:") + str((takeoff_dt.minute // 15) * 15))
            r_slot = (base_id, landing_dt.strftime("%Y-%m-%d %H:") + str((landing_dt.minute // 15) * 15))
            base_launch_slots[t_slot] += 1
            base_recovery_slots[r_slot] += 1
            if base_launch_slots[t_slot] > base.get("launch_rate_15m", 4):
                violations.append({
                    "rule": "RUNWAY_LAUNCH_CAPACITY_BREACH",
                    "severity": "HIGH",
                    "message": f"Base {base.get('name', base_id)} exceeds runway launch rate ({base_launch_slots[t_slot]}/{base.get('launch_rate_15m', 4)} in slot {t_slot[1]}).",
                })

        # 4. Stores consumption
        code = m_info.get("payload_class", "BVR-AAM")
        stock_consumed[(base_id, code)] += 2

    # Check overlaps for aircraft
    for tail, sorties in tail_sorties.items():
        sorted_s = sorted(sorties, key=lambda x: x[0])
        for i in range(len(sorted_s) - 1):
            curr_land = sorted_s[i][1]
            next_take = sorted_s[i+1][0]
            if curr_land > next_take:
                violations.append({
                    "rule": "AIRCRAFT_OVERLAP",
                    "severity": "CRITICAL",
                    "message": f"Aircraft {tail} assigned overlapping sorties without recovery.",
                })
            elif minutes_between(curr_land, next_take) < 45:
                violations.append({
                    "rule": "TURNAROUND_INSUFFICIENT",
                    "severity": "HIGH",
                    "message": f"Aircraft {tail} turnaround between sorties is {minutes_between(curr_land, next_take)}m (minimum 45m required).",
                })

    # Check stock reserve minimums
    for (b_id, code), qty in stock_consumed.items():
        st = stock_map.get((b_id, code))
        if st:
            rem = st.get("qty", 0) - qty
            if rem < st.get("reserve_min", 10):
                violations.append({
                    "rule": "STOCK_RESERVE_BREACH",
                    "severity": "HIGH",
                    "message": f"Depot {b_id} store {code} falls below reserve threshold ({rem} remaining, minimum {st.get('reserve_min', 10)}).",
                })

    is_valid = len(violations) == 0
    return {
        "valid": is_valid,
        "violations": violations,
        "warnings": warnings,
        "violation_count": len(violations),
        "warning_count": len(warnings),
        "status": "PASS" if is_valid else "FAIL",
        "summary": "Plan satisfies all operational hard constraints." if is_valid else f"Plan fails {len(violations)} operational constraint(s).",
    }
