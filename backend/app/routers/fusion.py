from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.tables import FeedRow, ConflictRow
from backend.app.fusion.engine import toggle_feed_status
from backend.app.auditlog import append_audit_entry

router = APIRouter(prefix="/api/v1/fusion", tags=["fusion"])

class ToggleFeedRequest(BaseModel):
    feed_id: str
    status: str  # HEALTHY, DEGRADED, OFFLINE

@router.get("/feeds")
def get_feeds(db: Session = Depends(get_db)):
    return db.query(FeedRow).all()

@router.post("/toggle")
def toggle_feed(req: ToggleFeedRequest, db: Session = Depends(get_db)):
    feed = toggle_feed_status(db, req.feed_id, req.status)
    if not feed:
        raise HTTPException(status_code=404, detail=f"Feed {req.feed_id} not found.")
    append_audit_entry(
        db,
        actor="operator",
        action="FEED_STATUS_CHANGE",
        ref=f"FEED:{req.feed_id}",
        diff={"feed_id": req.feed_id, "new_status": req.status},
        reason=f"Operator manually adjusted telemetry feed status to {req.status}.",
    )
    db.commit()
    return feed

@router.get("/conflicts")
def get_conflicts(db: Session = Depends(get_db)):
    return db.query(ConflictRow).order_by(ConflictRow.id.desc()).all()

@router.post("/conflicts/{conflict_id}/resolve")
def resolve_conflict(conflict_id: int, db: Session = Depends(get_db)):
    c = db.query(ConflictRow).filter(ConflictRow.id == conflict_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conflict not found.")
    c.resolved = True
    c.resolution = "Acknowledged and resolved by operator."
    db.commit()
    return {"status": "RESOLVED", "conflict_id": conflict_id}
