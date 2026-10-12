from __future__ import annotations
import hashlib
import hmac
import time
from typing import Any
import jwt
from backend.app.config import get_settings

def hash_password(password: str) -> str:
    salt = "projectx_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hmac.compare_digest(hash_password(plain_password), hashed_password)

def create_access_token(data: dict[str, Any], expires_in_sec: int = 86400) -> str:
    settings = get_settings()
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in_sec
    payload["iat"] = int(time.time())
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def decode_access_token(token: str) -> dict[str, Any] | None:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except Exception:
        return None
