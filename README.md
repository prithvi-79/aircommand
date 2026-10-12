# PROJECTX — Dynamic Air Operations & Resource Optimisation Platform

Unified AI/ML Decision-Support Platform engineered for the **Smart India Hackathon (SIH 2026)**, Problem Statement **26250** (*Air Power - Dynamic Air Operations & Resource Optimisation*).

## Architecture Overview
- **Backend**: FastAPI, SQLAlchemy, SQLite (`projectx.db`), Google OR-Tools CP-SAT Solver, Scikit-Learn RandomForest inference.
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide React icons.
- **AI/ML Engine**: Real scikit-learn models from AERIS:
  - `aircraft_degradation_rf.joblib`: Airframe readiness degradation regressor.
  - `fleet_readiness_rf.joblib`: Multi-horizon (24h, 48h, 72h) fleet readiness forecaster.
  - `operational_risk_rf.joblib`: Mission and asset operational risk classifier.
- **Optimization & ATO Engine**: Google OR-Tools CP-SAT scheduler with Pareto multi-posture modes (`BALANCED`, `RESERVE_FOCUSED`, `HIGH_TEMPO`) and an independent mathematical constraint validator.
- **Dynamic Retasking**: Contingency injection lab with 4 ranked Courses of Action (COAs) and AERIS Causal Chain (*What Changed → What Was Affected → Why → Resulting Impact*).
- **Sensor Fusion (COP)**: 8 multi-source telemetry feeds with live health toggles, degrade/restore controls, and Conflict Inbox.
- **Governance**: Cryptographic SHA-256 hash-chained immutable audit trail with 1-click integrity verification.
- **C2 Copilot**: Grounded natural language tactical advisory drawer.

---

## Quick Start Instructions

### 1. Backend API (FastAPI)
```bash
# Activate virtual environment
.venv\Scripts\activate

# Start backend server (runs on http://127.0.0.1:8000)
python backend\run.py
```

### 2. Frontend Web App (Next.js)
```bash
cd frontend

# Production start (already compiled)
npm run start
# OR Development mode
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Demo Roles
Instant 1-click role switching available via the top-right user menu:
- **Ops Planner** (`planner@projectx.local`): Optimise ATO, inject events, submit order.
- **Air Commander** (`commander@projectx.local`): Review & approve ATO, authorize COAs, publish order.
- **Independent Auditor** (`auditor@projectx.local`): Co-sign ATO, verify SHA-256 hash-chain integrity.
- **Fleet Officer** (`fleet@projectx.local`): Fleet maintenance and airframe serviceability.
- **Crew Officer** (`crew@projectx.local`): Roster management and rest compliance.
- **Intel Analyst** (`analyst@projectx.local`): Threat warnings and radar corridors.
- **Administrator** (`admin@projectx.local`): Full administrative control.

Default password: `ProjectX-demo-2026`
