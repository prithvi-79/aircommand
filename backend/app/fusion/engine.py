from __future__ import annotations
from datetime import datetime
from typing import Any
from sqlalchemy.orm import Session
from backend.app.tables import FeedRow, ConflictRow

INITIAL_FEEDS = [
    {
        "id": "ATC-SURFACE",
        "name": "Surface Movement & ATC Radar",
        "category": "AIRSPACE",
        "status": "HEALTHY",
        "latency_ms": 18,
        "details": {"active_tracks": 14, "radar_frequency_ghz": 9.4, "mode_s_coverage": "100%"},
    },
    {
        "id": "METAR-RADAR",
        "name": "Doppler Meteorological Radar",
        "category": "ENVIRONMENT",
        "status": "HEALTHY",
        "latency_ms": 32,
        "details": {"scans_per_min": 6, "convective_alerts": 0, "reflectivity_max_dbz": 24},
    },
    {
        "id": "ATF-DEPOT",
        "name": "Aviation Turbine Fuel (ATF) Logistics",
        "category": "LOGISTICS",
        "status": "HEALTHY",
        "latency_ms": 45,
        "details": {"total_reserves_kl": 14200, "flow_rate_lpm": 3200, "safety_buffer_pct": 94},
    },
    {
        "id": "MUNITIONS-ARMORY",
        "name": "Depot Guided Weapons & Stores",
        "category": "LOGISTICS",
        "status": "HEALTHY",
        "latency_ms": 28,
        "details": {"bvr_missiles_ready": 86, "precision_bombs_ready": 64, "inspection_cleared": True},
    },
    {
        "id": "MAINTENANCE-BAY",
        "name": "Airframe Health & Fleet Telemetry",
        "category": "ENGINEERING",
        "status": "HEALTHY",
        "latency_ms": 52,
        "details": {"monitored_airframes": 18, "vibration_anomalies": 0, "avionics_status": "NOMINAL"},
    },
    {
        "id": "THREAT-RWR",
        "name": "Radar Warning & Tactical Intercepts",
        "category": "INTEL",
        "status": "HEALTHY",
        "latency_ms": 12,
        "details": {"threat_emitters_active": 1, "elint_classification": "STANDOFF_RADAR", "corridor_risk": "LOW"},
    },
    {
        "id": "CREW-BIO",
        "name": "Aircrew Roster & Rest Telemetry",
        "category": "HUMAN_FACTORS",
        "status": "HEALTHY",
        "latency_ms": 64,
        "details": {"pilots_on_duty": 16, "pilots_in_mandatory_rest": 8, "avg_fatigue_index": 0.14},
    },
    {
        "id": "SATCOM-UPLINK",
        "name": "Mil-Sat Beyond Line-of-Sight Uplink",
        "category": "COMMS",
        "status": "HEALTHY",
        "latency_ms": 95,
        "details": {"bandwidth_mbps": 45.0, "encryption": "AES-256-GCM", "ber_packet_loss": 0.0001},
    },
]

def seed_feeds_if_empty(db: Session) -> None:
    if db.query(FeedRow).count() == 0:
        now = datetime.utcnow().isoformat() + "Z"
        for item in INITIAL_FEEDS:
            f = FeedRow(
                id=item["id"],
                name=item["name"],
                category=item["category"],
                status=item["status"],
                latency_ms=item["latency_ms"],
                last_sync=now,
                details=item["details"],
            )
            db.add(f)
        db.commit()

def toggle_feed_status(db: Session, feed_id: str, new_status: str) -> FeedRow | None:
    feed = db.query(FeedRow).filter(FeedRow.id == feed_id).first()
    if not feed:
        return None
    feed.status = new_status
    feed.last_sync = datetime.utcnow().isoformat() + "Z"
    if new_status == "DEGRADED":
        feed.latency_ms = 480
        # Trigger an anomaly conflict
        c = ConflictRow(
            feed_id=feed_id,
            severity="WARNING",
            message=f"Feed {feed.name} degraded. High latency ({feed.latency_ms}ms) and potential telemetry dropouts.",
            detected_at=datetime.utcnow().isoformat() + "Z",
            resolved=False,
        )
        db.add(c)
    elif new_status == "OFFLINE":
        feed.latency_ms = 9999
        c = ConflictRow(
            feed_id=feed_id,
            severity="CRITICAL",
            message=f"Feed {feed.name} link lost! Telemetry stream severed.",
            detected_at=datetime.utcnow().isoformat() + "Z",
            resolved=False,
        )
        db.add(c)
    else:
        feed.latency_ms = 25
        # Mark conflicts as resolved
        for conf in db.query(ConflictRow).filter(ConflictRow.feed_id == feed_id, ConflictRow.resolved == False).all():
            conf.resolved = True
            conf.resolution = "Telemetry link restored to HEALTHY state."
    db.commit()
    db.refresh(feed)
    return feed
