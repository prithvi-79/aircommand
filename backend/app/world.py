from __future__ import annotations
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.tables import (
    User, BaseRow, AircraftTypeRow, AircraftRow, CrewRow, StockRow,
    MissionRow, PlanRow, AssignmentRow, FeedRow, ConflictRow, EventRow
)
from backend.app.security import hash_password
from backend.app.auditlog import append_audit_entry
from backend.app.fusion.engine import seed_feeds_if_empty
from backend.app.optimiser.model import solve_air_tasking_order

DEMO_USERS = [
    {"id": "planner", "email": "planner@projectx.local", "name": "Wg Cdr A. Sharma (Ops Planner)", "role": "planner"},
    {"id": "commander", "email": "commander@projectx.local", "name": "Air Commodore R. Kapoor (Commander)", "role": "commander"},
    {"id": "auditor", "email": "auditor@projectx.local", "name": "Col S. Mukherjee (Independent Auditor)", "role": "auditor"},
    {"id": "fleet", "email": "fleet@projectx.local", "name": "Sqn Ldr V. Nair (Fleet Officer)", "role": "fleet"},
    {"id": "crew", "email": "crew@projectx.local", "name": "Sqn Ldr P. Verma (Crew Officer)", "role": "crew"},
    {"id": "analyst", "email": "analyst@projectx.local", "name": "Flt Lt K. Singh (Intel Analyst)", "role": "analyst"},
    {"id": "admin", "email": "admin@projectx.local", "name": "Administrator", "role": "admin"},
]

BASES_DATA = [
    {
        "id": "AMBALA-AFS",
        "name": "Ambala Air Force Station",
        "lat": 30.368,
        "lon": 76.817,
        "runways": ["12L/30R", "12R/30L"],
        "launch_rate_15m": 6,
        "recovery_rate_15m": 6,
        "parking": 32,
        "fuel_state": 96.5,
        "status": "ACTIVE",
        "closures": [],
        "weather": {"crosswind_knots": 8, "visibility_km": 10.0, "ceiling_ft": 4500, "condition": "CAVOK"},
    },
    {
        "id": "HALWARA-AFS",
        "name": "Halwara Air Force Station",
        "lat": 30.749,
        "lon": 75.633,
        "runways": ["13/31"],
        "launch_rate_15m": 5,
        "recovery_rate_15m": 5,
        "parking": 28,
        "fuel_state": 92.0,
        "status": "ACTIVE",
        "closures": [],
        "weather": {"crosswind_knots": 11, "visibility_km": 9.5, "ceiling_ft": 4000, "condition": "CLEAR"},
    },
    {
        "id": "ADAMPUR-AFS",
        "name": "Adampur Air Force Station",
        "lat": 31.433,
        "lon": 75.758,
        "runways": ["13/31"],
        "launch_rate_15m": 4,
        "recovery_rate_15m": 4,
        "parking": 24,
        "fuel_state": 89.0,
        "status": "ACTIVE",
        "closures": [],
        "weather": {"crosswind_knots": 14, "visibility_km": 8.0, "ceiling_ft": 3500, "condition": "SCATTERED"},
    },
    {
        "id": "BAREILLY-AFS",
        "name": "Bareilly Air Force Station",
        "lat": 28.422,
        "lon": 79.450,
        "runways": ["11/29"],
        "launch_rate_15m": 5,
        "recovery_rate_15m": 5,
        "parking": 30,
        "fuel_state": 95.0,
        "status": "ACTIVE",
        "closures": [],
        "weather": {"crosswind_knots": 6, "visibility_km": 10.0, "ceiling_ft": 5000, "condition": "CAVOK"},
    },
    {
        "id": "HASIMARA-AFS",
        "name": "Hasimara Air Force Station",
        "lat": 26.702,
        "lon": 89.370,
        "runways": ["11R/29L"],
        "launch_rate_15m": 4,
        "recovery_rate_15m": 4,
        "parking": 20,
        "fuel_state": 94.0,
        "status": "ACTIVE",
        "closures": [],
        "weather": {"crosswind_knots": 9, "visibility_km": 10.0, "ceiling_ft": 4200, "condition": "CLEAR"},
    },
    {
        "id": "JODHPUR-AFS",
        "name": "Jodhpur Air Force Station",
        "lat": 26.251,
        "lon": 73.049,
        "runways": ["05/23"],
        "launch_rate_15m": 5,
        "recovery_rate_15m": 5,
        "parking": 26,
        "fuel_state": 91.5,
        "status": "ACTIVE",
        "closures": [],
        "weather": {"crosswind_knots": 12, "visibility_km": 10.0, "ceiling_ft": 6000, "condition": "CLEAR"},
    },
]

AIRCRAFT_TYPES = [
    {"id": "RAFALE", "name": "Dassault Rafale", "role": "OMNIROLE_FIGHTER", "max_range_km": 3700.0, "cruise_speed_knots": 510.0, "turnaround_min": 45, "crew_required": 1},
    {"id": "SU-30MKI", "name": "Sukhoi Su-30MKI", "role": "AIR_SUPERIORITY", "max_range_km": 3000.0, "cruise_speed_knots": 480.0, "turnaround_min": 50, "crew_required": 2},
    {"id": "TEJAS-MK1A", "name": "LCA Tejas Mk1A", "role": "LIGHT_COMBAT", "max_range_km": 1850.0, "cruise_speed_knots": 460.0, "turnaround_min": 40, "crew_required": 1},
    {"id": "MIG-29UPG", "name": "MiG-29UPG Baaz", "role": "AIR_SUPERIORITY", "max_range_km": 2100.0, "cruise_speed_knots": 490.0, "turnaround_min": 45, "crew_required": 1},
    {"id": "NETRA-AEW&C", "name": "DRDO Netra AEW&C", "role": "AIRBORNE_EARLY_WARNING", "max_range_km": 3100.0, "cruise_speed_knots": 420.0, "turnaround_min": 60, "crew_required": 3},
    {"id": "IL-78-MKI", "name": "Ilyushin Il-78 Tanker", "role": "AERIAL_REFUELLING", "max_range_km": 7300.0, "cruise_speed_knots": 430.0, "turnaround_min": 90, "crew_required": 4},
]

FLEET_DATA = [
    {"tail": "RB-001", "type_id": "RAFALE", "base_id": "AMBALA-AFS", "status": "FMC", "engine_health": 98.0, "engine_temp": 725.0, "fuel_level": 95.0, "readiness": 97.0, "flight_hours": 240.0, "hours_to_inspection": 48.0},
    {"tail": "RB-002", "type_id": "RAFALE", "base_id": "AMBALA-AFS", "status": "FMC", "engine_health": 96.5, "engine_temp": 730.0, "fuel_level": 92.0, "readiness": 96.0, "flight_hours": 310.0, "hours_to_inspection": 42.0},
    {"tail": "RB-003", "type_id": "RAFALE", "base_id": "HASIMARA-AFS", "status": "FMC", "engine_health": 95.0, "engine_temp": 735.0, "fuel_level": 90.0, "readiness": 95.0, "flight_hours": 180.0, "hours_to_inspection": 52.0},
    {"tail": "SB-121", "type_id": "SU-30MKI", "base_id": "HALWARA-AFS", "status": "FMC", "engine_health": 94.0, "engine_temp": 738.0, "fuel_level": 96.0, "readiness": 93.0, "flight_hours": 620.0, "hours_to_inspection": 35.0},
    {"tail": "SB-122", "type_id": "SU-30MKI", "base_id": "HALWARA-AFS", "status": "FMC", "engine_health": 92.0, "engine_temp": 742.0, "fuel_level": 88.0, "readiness": 91.0, "flight_hours": 750.0, "hours_to_inspection": 28.0},
    {"tail": "SB-145", "type_id": "SU-30MKI", "base_id": "BAREILLY-AFS", "status": "FMC", "engine_health": 97.0, "engine_temp": 728.0, "fuel_level": 94.0, "readiness": 95.5, "flight_hours": 410.0, "hours_to_inspection": 55.0},
    {"tail": "SB-146", "type_id": "SU-30MKI", "base_id": "BAREILLY-AFS", "status": "FMC", "engine_health": 93.5, "engine_temp": 734.0, "fuel_level": 91.0, "readiness": 92.0, "flight_hours": 580.0, "hours_to_inspection": 38.0},
    {"tail": "SB-170", "type_id": "SU-30MKI", "base_id": "JODHPUR-AFS", "status": "FMC", "engine_health": 91.0, "engine_temp": 745.0, "fuel_level": 85.0, "readiness": 89.0, "flight_hours": 890.0, "hours_to_inspection": 22.0},
    {"tail": "LA-501", "type_id": "TEJAS-MK1A", "base_id": "JODHPUR-AFS", "status": "FMC", "engine_health": 99.0, "engine_temp": 718.0, "fuel_level": 98.0, "readiness": 98.0, "flight_hours": 120.0, "hours_to_inspection": 60.0},
    {"tail": "LA-502", "type_id": "TEJAS-MK1A", "base_id": "JODHPUR-AFS", "status": "FMC", "engine_health": 97.5, "engine_temp": 722.0, "fuel_level": 94.0, "readiness": 96.5, "flight_hours": 165.0, "hours_to_inspection": 54.0},
    {"tail": "KB-701", "type_id": "MIG-29UPG", "base_id": "ADAMPUR-AFS", "status": "FMC", "engine_health": 89.0, "engine_temp": 752.0, "fuel_level": 86.0, "readiness": 88.0, "flight_hours": 940.0, "hours_to_inspection": 18.0},
    {"tail": "KB-702", "type_id": "MIG-29UPG", "base_id": "ADAMPUR-AFS", "status": "PMC", "engine_health": 84.0, "engine_temp": 768.0, "fuel_level": 78.0, "readiness": 81.0, "flight_hours": 1120.0, "hours_to_inspection": 12.0},
    {"tail": "KB-703", "type_id": "MIG-29UPG", "base_id": "ADAMPUR-AFS", "status": "NMC", "engine_health": 72.0, "engine_temp": 815.0, "fuel_level": 40.0, "readiness": 55.0, "flight_hours": 1450.0, "hours_to_inspection": 2.0},
    {"tail": "AEW-01", "type_id": "NETRA-AEW&C", "base_id": "AMBALA-AFS", "status": "FMC", "engine_health": 98.0, "engine_temp": 710.0, "fuel_level": 96.0, "readiness": 98.0, "flight_hours": 340.0, "hours_to_inspection": 70.0},
    {"tail": "TNK-01", "type_id": "IL-78-MKI", "base_id": "HALWARA-AFS", "status": "FMC", "engine_health": 95.0, "engine_temp": 724.0, "fuel_level": 99.0, "readiness": 95.0, "flight_hours": 580.0, "hours_to_inspection": 45.0},
    {"tail": "IAF-RES-01", "type_id": "RAFALE", "base_id": "AMBALA-AFS", "status": "FMC", "engine_health": 99.5, "engine_temp": 715.0, "fuel_level": 100.0, "readiness": 99.0, "flight_hours": 90.0, "hours_to_inspection": 75.0},
    {"tail": "IAF-RES-02", "type_id": "SU-30MKI", "base_id": "HALWARA-AFS", "status": "FMC", "engine_health": 98.0, "engine_temp": 720.0, "fuel_level": 100.0, "readiness": 98.0, "flight_hours": 150.0, "hours_to_inspection": 68.0},
    {"tail": "IAF-RES-03", "type_id": "TEJAS-MK1A", "base_id": "JODHPUR-AFS", "status": "FMC", "engine_health": 99.0, "engine_temp": 714.0, "fuel_level": 100.0, "readiness": 99.0, "flight_hours": 80.0, "hours_to_inspection": 80.0},
]

CREW_DATA = [
    {"id": "CRW-01", "name": "Gp Capt R. 'Viper' Sengupta", "role": "PILOT", "rank": "Group Captain", "base_id": "AMBALA-AFS", "hours_24h": 1.5, "hours_7d": 14.0, "status": "AVAILABLE", "fatigue_index": 0.12},
    {"id": "CRW-02", "name": "Wg Cdr A. 'Hawk' Bhardwaj", "role": "PILOT", "rank": "Wing Commander", "base_id": "AMBALA-AFS", "hours_24h": 2.0, "hours_7d": 16.5, "status": "AVAILABLE", "fatigue_index": 0.15},
    {"id": "CRW-03", "name": "Sqn Ldr M. 'Titan' Deshmukh", "role": "PILOT", "rank": "Squadron Leader", "base_id": "HALWARA-AFS", "hours_24h": 0.0, "hours_7d": 10.0, "status": "AVAILABLE", "fatigue_index": 0.08},
    {"id": "CRW-04", "name": "Flt Lt S. 'Blaze' Rathore", "role": "WSO", "rank": "Flight Lieutenant", "base_id": "HALWARA-AFS", "hours_24h": 0.0, "hours_7d": 11.0, "status": "AVAILABLE", "fatigue_index": 0.09},
    {"id": "CRW-05", "name": "Wg Cdr K. 'Thunder' Pillai", "role": "PILOT", "rank": "Wing Commander", "base_id": "BAREILLY-AFS", "hours_24h": 3.0, "hours_7d": 18.0, "status": "AVAILABLE", "fatigue_index": 0.22},
    {"id": "CRW-06", "name": "Flt Lt P. 'Phantom' Joshi", "role": "WSO", "rank": "Flight Lieutenant", "base_id": "BAREILLY-AFS", "hours_24h": 3.0, "hours_7d": 18.0, "status": "AVAILABLE", "fatigue_index": 0.22},
    {"id": "CRW-07", "name": "Sqn Ldr T. 'Falcon' Bannerjee", "role": "PILOT", "rank": "Squadron Leader", "base_id": "ADAMPUR-AFS", "hours_24h": 1.0, "hours_7d": 12.0, "status": "AVAILABLE", "fatigue_index": 0.11},
    {"id": "CRW-08", "name": "Flt Lt N. 'Ghost' Chawla", "role": "PILOT", "rank": "Flight Lieutenant", "base_id": "ADAMPUR-AFS", "hours_24h": 6.8, "hours_7d": 24.0, "status": "REST", "fatigue_index": 0.68},
    {"id": "CRW-09", "name": "Wg Cdr D. 'Eagle' Mehta", "role": "PILOT", "rank": "Wing Commander", "base_id": "JODHPUR-AFS", "hours_24h": 0.0, "hours_7d": 8.0, "status": "AVAILABLE", "fatigue_index": 0.06},
    {"id": "CRW-10", "name": "Sqn Ldr H. 'Striker' Gill", "role": "PILOT", "rank": "Squadron Leader", "base_id": "JODHPUR-AFS", "hours_24h": 1.2, "hours_7d": 13.5, "status": "AVAILABLE", "fatigue_index": 0.13},
    {"id": "CRW-11", "name": "Wg Cdr S. 'Oracle' Roy", "role": "MISSION_COMMANDER", "rank": "Wing Commander", "base_id": "AMBALA-AFS", "hours_24h": 0.0, "hours_7d": 6.0, "status": "AVAILABLE", "fatigue_index": 0.05},
    {"id": "CRW-12", "name": "Sqn Ldr C. 'Tanker' Varghese", "role": "PILOT", "rank": "Squadron Leader", "base_id": "HALWARA-AFS", "hours_24h": 2.5, "hours_7d": 15.0, "status": "AVAILABLE", "fatigue_index": 0.18},
]

STOCKS_DATA = [
    {"base_id": "AMBALA-AFS", "code": "METEOR-BVR", "name": "Meteor BVR Air-to-Air Missiles", "category": "MUNITION", "qty": 48, "reserve_min": 12, "unit": "missiles"},
    {"base_id": "AMBALA-AFS", "code": "SCALP-EG", "name": "SCALP Standoff Cruise Missiles", "category": "MUNITION", "qty": 24, "reserve_min": 6, "unit": "missiles"},
    {"base_id": "AMBALA-AFS", "code": "ATF-FUEL", "name": "Aviation Turbine Fuel (Jet A-1)", "category": "FUEL", "qty": 4200, "reserve_min": 800, "unit": "kilo-litres"},
    {"base_id": "HALWARA-AFS", "code": "ASTRA-MK1", "name": "Astra Mk1 BVR Missiles", "category": "MUNITION", "qty": 64, "reserve_min": 16, "unit": "missiles"},
    {"base_id": "HALWARA-AFS", "code": "BRAHMOS-A", "name": "BrahMos Air-Launched Cruise Missiles", "category": "MUNITION", "qty": 18, "reserve_min": 4, "unit": "missiles"},
    {"base_id": "HALWARA-AFS", "code": "ATF-FUEL", "name": "Aviation Turbine Fuel (Jet A-1)", "category": "FUEL", "qty": 3800, "reserve_min": 750, "unit": "kilo-litres"},
    {"base_id": "BAREILLY-AFS", "code": "R-77-BVR", "name": "R-77 Active Radar BVR Missiles", "category": "MUNITION", "qty": 56, "reserve_min": 14, "unit": "missiles"},
    {"base_id": "BAREILLY-AFS", "code": "ATF-FUEL", "name": "Aviation Turbine Fuel (Jet A-1)", "category": "FUEL", "qty": 3500, "reserve_min": 700, "unit": "kilo-litres"},
    {"base_id": "ADAMPUR-AFS", "code": "R-73-WVR", "name": "R-73 Archer Heat-Seeking Missiles", "category": "MUNITION", "qty": 40, "reserve_min": 10, "unit": "missiles"},
    {"base_id": "ADAMPUR-AFS", "code": "ATF-FUEL", "name": "Aviation Turbine Fuel (Jet A-1)", "category": "FUEL", "qty": 2900, "reserve_min": 600, "unit": "kilo-litres"},
    {"base_id": "JODHPUR-AFS", "code": "ASRAAM-WVR", "name": "ASRAAM Close Combat Missiles", "category": "MUNITION", "qty": 52, "reserve_min": 12, "unit": "missiles"},
    {"base_id": "JODHPUR-AFS", "code": "ATF-FUEL", "name": "Aviation Turbine Fuel (Jet A-1)", "category": "FUEL", "qty": 3100, "reserve_min": 650, "unit": "kilo-litres"},
]

MISSIONS_DATA = [
    {
        "id": "MSN-26250-01",
        "name": "Eagle Shield · Northern Border Combat Air Patrol",
        "type": "CAP",
        "priority": 1,
        "base_id": "AMBALA-AFS",
        "start_window": "06:00 - 08:30",
        "duration_min": 120,
        "aircraft_required": 2,
        "crew_required": 2,
        "payload_class": "METEOR-BVR",
        "target_zone": "Northern Ridge Patrol Box Alpha",
    },
    {
        "id": "MSN-26250-02",
        "name": "Thunderbolt · Deep Precision Standoff Interdiction",
        "type": "STRIKE",
        "priority": 1,
        "base_id": "HALWARA-AFS",
        "start_window": "07:15 - 09:45",
        "duration_min": 105,
        "aircraft_required": 2,
        "crew_required": 4,
        "payload_class": "BRAHMOS-A",
        "target_zone": "Forward Depot Sector Echo",
    },
    {
        "id": "MSN-26250-03",
        "name": "Iron Clad · Escort & SEAD Suppression",
        "type": "SEAD",
        "priority": 1,
        "base_id": "BAREILLY-AFS",
        "start_window": "07:30 - 09:30",
        "duration_min": 90,
        "aircraft_required": 2,
        "crew_required": 4,
        "payload_class": "R-77-BVR",
        "target_zone": "Corridor 12 Airspace",
    },
    {
        "id": "MSN-26250-04",
        "name": "Eye in the Sky · Airborne Early Warning Orbit",
        "type": "AEW&C",
        "priority": 2,
        "base_id": "AMBALA-AFS",
        "start_window": "05:45 - 10:00",
        "duration_min": 240,
        "aircraft_required": 1,
        "crew_required": 3,
        "payload_class": "RECON-AVIONICS",
        "target_zone": "Punjab High Orbit Track",
    },
    {
        "id": "MSN-26250-05",
        "name": "Desert Falcon · Western Air Superiority Sweep",
        "type": "CAP",
        "priority": 2,
        "base_id": "JODHPUR-AFS",
        "start_window": "08:00 - 10:15",
        "duration_min": 90,
        "aircraft_required": 2,
        "crew_required": 2,
        "payload_class": "ASRAAM-WVR",
        "target_zone": "Thar Sector West",
    },
    {
        "id": "MSN-26250-06",
        "name": "Sky Tanker · Mid-Air Fuel Refuelling Track",
        "type": "TANKER",
        "priority": 2,
        "base_id": "HALWARA-AFS",
        "start_window": "06:45 - 11:00",
        "duration_min": 210,
        "aircraft_required": 1,
        "crew_required": 4,
        "payload_class": "ATF-FUEL",
        "target_zone": "Refuelling Anchor Point Charlie",
    },
]

def seed_database(db: Session) -> None:
    # 1. Users
    if db.query(User).count() == 0:
        pwd = hash_password("ProjectX-demo-2026")
        for u in DEMO_USERS:
            db.add(User(
                id=u["id"],
                email=u["email"],
                password_hash=pwd,
                role=u["role"],
                display_name=u["name"],
            ))
        db.commit()

    # 2. Bases
    if db.query(BaseRow).count() == 0:
        for b in BASES_DATA:
            db.add(BaseRow(**b))
        db.commit()

    # 3. Aircraft Types
    if db.query(AircraftTypeRow).count() == 0:
        for at in AIRCRAFT_TYPES:
            db.add(AircraftTypeRow(**at))
        db.commit()

    # 4. Fleet
    if db.query(AircraftRow).count() == 0:
        for ac in FLEET_DATA:
            db.add(AircraftRow(**ac))
        db.commit()

    # 5. Crew
    if db.query(CrewRow).count() == 0:
        for cr in CREW_DATA:
            db.add(CrewRow(**cr))
        db.commit()

    # 6. Stocks
    if db.query(StockRow).count() == 0:
        for st in STOCKS_DATA:
            db.add(StockRow(**st))
        db.commit()

    # 7. Missions
    if db.query(MissionRow).count() == 0:
        for ms in MISSIONS_DATA:
            db.add(MissionRow(**ms))
        db.commit()

    # 8. Sensor Feeds
    seed_feeds_if_empty(db)

    # 9. Initial Seed Air Tasking Order
    if db.query(PlanRow).count() == 0:
        snapshot = {
            "epoch": datetime.utcnow().isoformat() + "Z",
            "missions": MISSIONS_DATA,
            "aircraft": FLEET_DATA,
            "crew": CREW_DATA,
            "bases": BASES_DATA,
            "stocks": STOCKS_DATA,
        }
        res = solve_air_tasking_order(snapshot, posture="BALANCED")
        plan_id = "ATO-26250-ALPHA"
        
        plan = PlanRow(
            id=plan_id,
            version_no=1,
            status="OPTIMISED",
            posture="BALANCED",
            objective_weights={"value": 500, "risk": 15, "stability": 100},
            horizon=24,
            seed=26250,
            solver_stats=res["solver_stats"],
            kpis=res["kpis"],
            validation=res["validation"],
            label="Air Tasking Order 26250-Alpha (Baseline)",
            created_by="planner@projectx.local",
            submitted_by="planner@projectx.local",
            digest="sha256:d894e637a85c0e1832049e7b3",
        )
        db.add(plan)
        db.commit()

        for asg in res["assignments"]:
            db.add(AssignmentRow(
                plan_id=plan_id,
                mission_id=asg["mission_id"],
                tail=asg["tail"],
                crew_ids=asg["crew_ids"],
                takeoff=asg["takeoff"],
                landing=asg["landing"],
                base_id=asg["base_id"],
                status=asg["status"],
                payload=asg["payload"],
            ))
        db.commit()

        # Append Genesis and Plan creation in Audit Log
        append_audit_entry(
            db,
            actor="SYSTEM",
            action="GENESIS_SEED",
            ref="SYSTEM:BOOTSTRAP",
            diff={"bases": len(BASES_DATA), "aircraft": len(FLEET_DATA), "missions": len(MISSIONS_DATA)},
            reason="Initialized ProjectX operational world state for SIH 26250.",
        )
        append_audit_entry(
            db,
            actor="planner@projectx.local",
            action="ATO_OPTIMISED",
            ref=f"PLAN:{plan_id}",
            diff={"posture": "BALANCED", "sorties": len(res['assignments']), "readiness": res['kpis']['overall_readiness']},
            reason="Baseline CP-SAT optimization executed with Balanced Posture.",
        )
        db.commit()
