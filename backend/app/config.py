from __future__ import annotations
import os
import sys
from pathlib import Path
from pydantic_settings import BaseSettings

# Windows DLL directory hook for ortools/scipy/sklearn
if sys.platform == "win32":
    try:
        sklearn_libs = Path(sys.executable).parent.parent / "Lib" / "site-packages" / "sklearn" / ".libs"
        if sklearn_libs.exists():
            os.add_dll_directory(str(sklearn_libs))
    except Exception:
        pass

class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./projectx.db")
    jwt_secret: str = os.getenv("JWT_SECRET", "projectx-dynamic-air-operations-secret-key-2026")
    demo_mode: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

_settings: Settings | None = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

def set_settings(cfg: Settings) -> None:
    global _settings
    _settings = cfg
