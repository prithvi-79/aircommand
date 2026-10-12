from __future__ import annotations
from datetime import datetime, timedelta

def parse_iso(iso_str: str) -> datetime:
    try:
        return datetime.fromisoformat(iso_str.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()

def to_iso(dt: datetime) -> str:
    return dt.isoformat() + "Z"

def minutes_between(start_dt: datetime, end_dt: datetime) -> int:
    return int((end_dt - start_dt).total_seconds() / 60)

def add_minutes(dt: datetime, minutes: int) -> datetime:
    return dt + timedelta(minutes=minutes)
