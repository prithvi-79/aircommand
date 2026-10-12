from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db import get_db
from backend.app.tables import User
from backend.app.security import create_access_token, decode_access_token, verify_password
from backend.app.rbac import ROLES

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class DemoRequest(BaseModel):
    role: str

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role, "name": user.display_name})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.display_name,
        }
    }

@router.post("/demo")
def demo_login(req: DemoRequest, db: Session = Depends(get_db)):
    role_key = req.role.lower()
    role_info = ROLES.get(role_key)
    if not role_info:
        raise HTTPException(status_code=400, detail=f"Role '{req.role}' is not recognised.")
    
    user = db.query(User).filter(User.role == role_key).first()
    if not user:
        user = db.query(User).filter(User.id == role_key).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found.")
        
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role, "name": user.display_name})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.display_name,
        }
    }

@router.get("/me")
def get_current_user(authorization: str | None = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        # Return default planner for easy demo access if unauthenticated
        planner = db.query(User).filter(User.role == "planner").first()
        return {
            "id": planner.id if planner else "planner",
            "email": planner.email if planner else "planner@projectx.local",
            "role": planner.role if planner else "planner",
            "name": planner.display_name if planner else "Wg Cdr A. Sharma",
        }
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired or token invalid.")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.display_name,
    }
