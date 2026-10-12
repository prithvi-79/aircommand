from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.tables import AuditEntry
from backend.app.auditlog import verify_audit_chain

router = APIRouter(prefix="/api/v1/audit", tags=["audit"])

@router.get("/entries")
def get_audit_entries(db: Session = Depends(get_db)):
    return db.query(AuditEntry).order_by(AuditEntry.seq.desc()).all()

@router.post("/verify")
def verify_integrity(db: Session = Depends(get_db)):
    return verify_audit_chain(db)
