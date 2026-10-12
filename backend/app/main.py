from __future__ import annotations
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.config import get_settings
from backend.app.db import configure_engine, get_engine, Base, get_session_factory
from backend.app.world import seed_database

# Routers
from backend.app.routers.auth import router as auth_router
from backend.app.routers.ops import router as ops_router
from backend.app.routers.fusion import router as fusion_router
from backend.app.routers.retask import router as retask_router
from backend.app.routers.ml_analytics import router as ml_router
from backend.app.routers.copilot import router as copilot_router
from backend.app.routers.audit import router as audit_router

def create_app() -> FastAPI:
    settings = get_settings()
    engine = configure_engine()
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = get_session_factory()
    # Initialize and seed database if empty
    with SessionLocal() as db:
        seed_database(db)

    app = FastAPI(
        title="ProjectX — Dynamic Air Operations & Resource Optimisation C2",
        description="Unified Tactical Command & Decision-Support System (SIH 2026 Problem Statement 26250)",
        version="1.0.0",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        req_id = request.headers.get("x-request-id", uuid.uuid4().hex[:16])
        request.state.request_id = req_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response

    @app.get("/")
    @app.get("/healthz")
    @app.get("/api/healthz")
    def health_check():
        return {
            "status": "HEALTHY",
            "system": "ProjectX Tactical C2 Engine",
            "version": "1.0.0",
            "sih_problem_id": "26250",
        }

    # Register Routers
    app.include_router(auth_router)
    app.include_router(ops_router)
    app.include_router(fusion_router)
    app.include_router(retask_router)
    app.include_router(ml_router)
    app.include_router(copilot_router)
    app.include_router(audit_router)

    return app

app = create_app()
