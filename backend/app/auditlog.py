from __future__ import annotations
import hashlib
import json
from datetime import datetime
from typing import Any
from sqlalchemy.orm import Session
from backend.app.tables import AuditEntry

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def _canonical_json(data: Any) -> str:
    return json.dumps(data, sort_keys=True, separators=(",", ":"))

def append_audit_entry(
    db: Session,
    actor: str,
    action: str,
    ref: str,
    diff: dict[str, Any] | None = None,
    reason: str = "",
) -> AuditEntry:
    last = db.query(AuditEntry).order_by(AuditEntry.seq.desc()).first()
    prev_hash = last.hash if last else GENESIS_HASH
    seq = (last.seq + 1) if last else 1
    now = datetime.utcnow()
    diff_payload = diff or {}
    
    raw = f"{seq}|{now.isoformat()}|{actor}|{action}|{ref}|{prev_hash}|{_canonical_json(diff_payload)}"
    entry_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    
    entry = AuditEntry(
        seq=seq,
        at=now,
        actor=actor,
        action=action,
        ref=ref,
        diff=diff_payload,
        reason=reason,
        prev_hash=prev_hash,
        hash=entry_hash,
    )
    db.add(entry)
    db.flush()
    return entry

def verify_audit_chain(db: Session) -> dict[str, Any]:
    entries = db.query(AuditEntry).order_by(AuditEntry.seq.asc()).all()
    if not entries:
        return {"valid": True, "count": 0, "message": "Audit ledger is clean (0 entries)."}
    
    expected_prev = GENESIS_HASH
    for entry in entries:
        if entry.prev_hash != expected_prev:
            return {
                "valid": False,
                "broken_seq": entry.seq,
                "message": f"Hash chain discrepancy at sequence {entry.seq}: expected prev {expected_prev}, got {entry.prev_hash}",
            }
        
        raw = f"{entry.seq}|{entry.at.isoformat()}|{entry.actor}|{entry.action}|{entry.ref}|{entry.prev_hash}|{_canonical_json(entry.diff)}"
        recomputed = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        if recomputed != entry.hash:
            return {
                "valid": False,
                "broken_seq": entry.seq,
                "message": f"Tampered record at sequence {entry.seq}: stored hash {entry.hash} != recomputed {recomputed}",
            }
        expected_prev = entry.hash
        
    return {
        "valid": True,
        "count": len(entries),
        "latest_hash": expected_prev,
        "message": f"Cryptographic integrity verified: all {len(entries)} audit records valid and intact.",
    }
