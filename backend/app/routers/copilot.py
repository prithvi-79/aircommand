from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.tables import CopilotChatRow
from backend.app.copilot.advisor import answer_c2_copilot_query

router = APIRouter(prefix="/api/v1/copilot", tags=["copilot"])

class CopilotQueryRequest(BaseModel):
    query: str
    operator_role: str = "commander"

@router.post("/query")
def ask_copilot(req: CopilotQueryRequest, db: Session = Depends(get_db)):
    res = answer_c2_copilot_query(db, req.query, user_role=req.operator_role)
    
    # Save chat history
    chat_entry = CopilotChatRow(
        query=req.query,
        response=res,
        actor=req.operator_role,
        at=datetime.utcnow().isoformat() + "Z",
    )
    db.add(chat_entry)
    db.commit()
    
    return res

@router.get("/history")
def get_copilot_history(db: Session = Depends(get_db)):
    return db.query(CopilotChatRow).order_by(CopilotChatRow.id.desc()).limit(20).all()
