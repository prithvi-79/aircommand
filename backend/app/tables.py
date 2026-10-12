from __future__ import annotations
from datetime import datetime
from typing import Any
from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.db import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(512))
    role: Mapped[str] = mapped_column(String(32))
    display_name: Mapped[str] = mapped_column(String(120))

class AuditEntry(Base):
    __tablename__ = "audit_entries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    seq: Mapped[int] = mapped_column(Integer, unique=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    actor: Mapped[str] = mapped_column(String(64))
    action: Mapped[str] = mapped_column(String(80))
    ref: Mapped[str] = mapped_column(String(120))
    diff: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    reason: Mapped[str] = mapped_column(Text, default="")
    prev_hash: Mapped[str] = mapped_column(String(64))
    hash: Mapped[str] = mapped_column(String(64))

class BaseRow(Base):
    __tablename__ = "bases"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    runways: Mapped[list[Any]] = mapped_column(JSON, default=list)
    launch_rate_15m: Mapped[int] = mapped_column(Integer, default=4)
    recovery_rate_15m: Mapped[int] = mapped_column(Integer, default=4)
    parking: Mapped[int] = mapped_column(Integer, default=24)
    fuel_state: Mapped[float] = mapped_column(Float, default=95.0)
    status: Mapped[str] = mapped_column(String(16), default="ACTIVE")
    closures: Mapped[list[Any]] = mapped_column(JSON, default=list)
    weather: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

class AircraftTypeRow(Base):
    __tablename__ = "aircraft_types"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    role: Mapped[str] = mapped_column(String(32))
    max_range_km: Mapped[float] = mapped_column(Float, default=3000.0)
    cruise_speed_knots: Mapped[float] = mapped_column(Float, default=450.0)
    turnaround_min: Mapped[int] = mapped_column(Integer, default=45)
    crew_required: Mapped[int] = mapped_column(Integer, default=1)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

class AircraftRow(Base):
    __tablename__ = "aircraft"
    tail: Mapped[str] = mapped_column(String(32), primary_key=True)
    type_id: Mapped[str] = mapped_column(String(32))
    base_id: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(8), default="FMC")  # FMC, PMC, NMC
    effective_status: Mapped[str] = mapped_column(String(8), default="FMC")
    defects: Mapped[list[Any]] = mapped_column(JSON, default=list)
    hours_to_inspection: Mapped[float] = mapped_column(Float, default=50.0)
    sorties_72h: Mapped[int] = mapped_column(Integer, default=0)
    ready_at: Mapped[str] = mapped_column(String(40), default="")
    freshness: Mapped[str] = mapped_column(String(16), default="FRESH")
    engine_health: Mapped[float] = mapped_column(Float, default=96.0)
    engine_temp: Mapped[float] = mapped_column(Float, default=730.0)
    fuel_level: Mapped[float] = mapped_column(Float, default=90.0)
    readiness: Mapped[float] = mapped_column(Float, default=94.0)
    flight_hours: Mapped[float] = mapped_column(Float, default=350.0)

class CrewRow(Base):
    __tablename__ = "crew"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    role: Mapped[str] = mapped_column(String(32), default="PILOT")
    rank: Mapped[str] = mapped_column(String(32), default="Wing Commander")
    quals: Mapped[list[Any]] = mapped_column(JSON, default=list)
    base_id: Mapped[str] = mapped_column(String(32))
    hours_24h: Mapped[float] = mapped_column(Float, default=0.0)
    hours_7d: Mapped[float] = mapped_column(Float, default=12.0)
    duty_start: Mapped[str | None] = mapped_column(String(40), nullable=True)
    last_rest_end: Mapped[str] = mapped_column(String(40), default="")
    available_at: Mapped[str] = mapped_column(String(40), default="")
    status: Mapped[str] = mapped_column(String(16), default="AVAILABLE")
    fatigue_index: Mapped[float] = mapped_column(Float, default=0.15)
    freshness: Mapped[str] = mapped_column(String(16), default="FRESH")

class StockRow(Base):
    __tablename__ = "stocks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    base_id: Mapped[str] = mapped_column(String(32))
    code: Mapped[str] = mapped_column(String(32))
    name: Mapped[str] = mapped_column(String(80))
    category: Mapped[str] = mapped_column(String(32), default="MUNITION")  # FUEL, MUNITION, SPARE
    qty: Mapped[int] = mapped_column(Integer, default=100)
    reserve_min: Mapped[int] = mapped_column(Integer, default=20)
    unit: Mapped[str] = mapped_column(String(16), default="units")
    freshness: Mapped[str] = mapped_column(String(16), default="FRESH")

class MissionRow(Base):
    __tablename__ = "missions"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    type: Mapped[str] = mapped_column(String(32))  # CAP, STRIKE, SEAD, RECON, ESCORT, TANKER
    priority: Mapped[int] = mapped_column(Integer, default=1)  # 1 (Highest), 2, 3
    base_id: Mapped[str] = mapped_column(String(32))
    start_window: Mapped[str] = mapped_column(String(40))
    duration_min: Mapped[int] = mapped_column(Integer, default=90)
    aircraft_required: Mapped[int] = mapped_column(Integer, default=2)
    crew_required: Mapped[int] = mapped_column(Integer, default=2)
    payload_class: Mapped[str] = mapped_column(String(32), default="BVR-AAM")
    target_zone: Mapped[str] = mapped_column(String(64), default="Sector North")
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

class PlanRow(Base):
    __tablename__ = "plans"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    version_no: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(32), default="DRAFT")  # DRAFT, OPTIMISED, VALIDATED, APPROVED, PUBLISHED
    posture: Mapped[str] = mapped_column(String(32), default="BALANCED")  # BALANCED, RESERVE_FOCUSED, HIGH_TEMPO
    objective_weights: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    horizon: Mapped[int] = mapped_column(Integer, default=24)
    seed: Mapped[int] = mapped_column(Integer, default=26250)
    solver_stats: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    kpis: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    validation: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    label: Mapped[str] = mapped_column(String(120), default="Air Tasking Order 26250-Alpha")
    created_by: Mapped[str] = mapped_column(String(64), default="planner@vyuha.local")
    submitted_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    co_approved_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    digest: Mapped[str] = mapped_column(String(64), default="")

class AssignmentRow(Base):
    __tablename__ = "assignments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_id: Mapped[str] = mapped_column(ForeignKey("plans.id"))
    mission_id: Mapped[str] = mapped_column(String(32))
    tail: Mapped[str] = mapped_column(String(32))
    crew_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    takeoff: Mapped[str] = mapped_column(String(40))
    landing: Mapped[str] = mapped_column(String(40))
    base_id: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="SCHEDULED")
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

class EventRow(Base):
    __tablename__ = "events"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    type: Mapped[str] = mapped_column(String(40))  # RUNWAY_CLOSURE, AIRCRAFT_ANOMALY, WEATHER_DEGRADATION, THREAT_SPIKE
    severity: Mapped[str] = mapped_column(String(16), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    effective_at: Mapped[str] = mapped_column(String(40))
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    source: Mapped[str] = mapped_column(String(32), default="SIMULATION_INJECTOR")
    status: Mapped[str] = mapped_column(String(16), default="OPEN")  # OPEN, RESOLVED

class CoaRow(Base):
    __tablename__ = "coas"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    event_id: Mapped[str] = mapped_column(String(64))
    preset: Mapped[str] = mapped_column(String(32))  # MINIMAL_CHANGE, MAX_VALUE, LOW_RISK, ROBUST
    name: Mapped[str] = mapped_column(String(80))
    rank: Mapped[int] = mapped_column(Integer, default=1)
    recommended: Mapped[bool] = mapped_column(Boolean, default=False)
    rationale: Mapped[str] = mapped_column(Text, default="")
    causal_chain: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    diff: Mapped[list[Any]] = mapped_column(JSON, default=list)
    assignments: Mapped[list[Any]] = mapped_column(JSON, default=list)

class FeedRow(Base):
    __tablename__ = "feeds"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    category: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(16), default="HEALTHY")  # HEALTHY, DEGRADED, OFFLINE
    latency_ms: Mapped[int] = mapped_column(Integer, default=45)
    last_sync: Mapped[str] = mapped_column(String(40))
    details: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

class ConflictRow(Base):
    __tablename__ = "conflicts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    feed_id: Mapped[str] = mapped_column(String(32))
    severity: Mapped[str] = mapped_column(String(16), default="WARNING")
    message: Mapped[str] = mapped_column(String(255))
    detected_at: Mapped[str] = mapped_column(String(40))
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolution: Mapped[str] = mapped_column(String(255), default="")

class CopilotChatRow(Base):
    __tablename__ = "copilot_chats"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    query: Mapped[str] = mapped_column(Text)
    response: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    actor: Mapped[str] = mapped_column(String(64), default="operator")
    at: Mapped[str] = mapped_column(String(40))
