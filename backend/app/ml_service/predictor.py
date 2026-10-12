from __future__ import annotations
import os
import joblib
import pandas as pd
from typing import Any

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "ml", "models")

class MLPredictor:
    _degradation_model = None
    _fleet_models = None
    _risk_bundle = None
    
    @classmethod
    def _load_models(cls):
        if cls._degradation_model is None:
            deg_path = os.path.join(MODELS_DIR, "aircraft_degradation_rf.joblib")
            if os.path.exists(deg_path):
                cls._degradation_model = joblib.load(deg_path)
        
        if cls._fleet_models is None:
            fleet_path = os.path.join(MODELS_DIR, "fleet_readiness_rf.joblib")
            if os.path.exists(fleet_path):
                cls._fleet_models = joblib.load(fleet_path)
                
        if cls._risk_bundle is None:
            risk_path = os.path.join(MODELS_DIR, "operational_risk_rf.joblib")
            if os.path.exists(risk_path):
                cls._risk_bundle = joblib.load(risk_path)

    @classmethod
    def predict_aircraft_degradation(
        cls,
        curr_readiness: float,
        engine_health: float,
        engine_temperature: float,
        flight_hours: float,
    ) -> dict[str, Any]:
        cls._load_models()
        if cls._degradation_model is None:
            # Fallback calculation
            pred_60 = max(10.0, curr_readiness - 3.5)
        else:
            df = pd.DataFrame([{
                "curr_readiness": curr_readiness,
                "engine_health": engine_health,
                "engine_temperature": engine_temperature,
                "flight_hours": flight_hours,
            }])
            pred_60 = float(cls._degradation_model.predict(df)[0])
            
        temp_delta = max(0.0, (engine_temperature - 740.0) * 0.12)
        degrade_step = max(1.0, (curr_readiness - pred_60) + temp_delta)
        
        pred_30 = round(max(15.0, curr_readiness - (degrade_step * 0.5)), 1)
        pred_60 = round(max(10.0, curr_readiness - degrade_step), 1)
        pred_120 = round(max(5.0, curr_readiness - (degrade_step * 1.8)), 1)
        
        return {
            "current_readiness": round(curr_readiness, 1),
            "projected_30m": pred_30,
            "projected_60m": pred_60,
            "projected_120m": pred_120,
            "degradation_rate_pct_hr": round(degrade_step, 2),
            "thermal_penalty": round(temp_delta, 2),
            "serviceability_status": "OPTIMAL" if pred_60 >= 85 else "ATTENTION" if pred_60 >= 70 else "CRITICAL",
        }

    @classmethod
    def predict_fleet_readiness(
        cls,
        curr_readiness: float = 88.5,
        ac_ready_ratio: float = 0.85,
        crew_avail_ratio: float = 0.90,
        res_health: float = 92.0,
        weather_index: float = 0.15,
        constraints_count: int = 2,
    ) -> dict[str, Any]:
        cls._load_models()
        horizons = ["24h", "48h", "72h"]
        predictions = {}
        
        row = [{
            "curr_readiness": curr_readiness,
            "ac_ready_ratio": ac_ready_ratio,
            "crew_avail_ratio": crew_avail_ratio,
            "res_health": res_health,
            "weather_index": weather_index,
            "constraints_count": constraints_count,
        }]
        df = pd.DataFrame(row)
        
        for h in horizons:
            if cls._fleet_models and h in cls._fleet_models:
                val = float(cls._fleet_models[h].predict(df)[0])
            else:
                drop = {"24h": 2.5, "48h": 5.8, "72h": 9.2}[h]
                val = max(20.0, curr_readiness - drop)
            predictions[h] = round(val, 1)
            
        return {
            "current_readiness": round(curr_readiness, 1),
            "forecast_24h": predictions.get("24h"),
            "forecast_48h": predictions.get("48h"),
            "forecast_72h": predictions.get("72h"),
            "drivers": {
                "active_constraints": constraints_count,
                "aircraft_serviceability_ratio": round(ac_ready_ratio * 100, 1),
                "crew_availability_ratio": round(crew_avail_ratio * 100, 1),
                "depot_stores_health": round(res_health, 1),
            },
        }

    @classmethod
    def predict_operational_risk(
        cls,
        features: dict[str, Any],
    ) -> dict[str, Any]:
        cls._load_models()
        if not cls._risk_bundle:
            return {"risk_level": "LOW", "risk_score": 0.15, "confidence": 0.90}
            
        model = cls._risk_bundle["model"]
        req_features = cls._risk_bundle["features"]
        medians = cls._risk_bundle.get("medians", {})
        classes = cls._risk_bundle.get("classes", ["LOW", "MEDIUM", "HIGH"])
        
        row = {}
        for f in req_features:
            val = features.get(f)
            if val is None:
                val = medians.get(f, 50.0)
            row[f] = float(val)
            
        df = pd.DataFrame([row])
        pred_idx = int(model.predict(df)[0])
        probas = model.predict_proba(df)[0]
        
        risk_class = classes[pred_idx] if pred_idx < len(classes) else "LOW"
        risk_score = float(probas[2] * 1.0 + probas[1] * 0.5 + probas[0] * 0.1) if len(probas) == 3 else 0.2
        confidence = float(max(probas))
        
        # Explainable feature importances
        importances = cls._risk_bundle.get("importances", {})
        top_drivers = sorted(
            [{"feature": k, "importance": round(v, 4)} for k, v in importances.items()],
            key=lambda x: x["importance"],
            reverse=True,
        )[:4]
        
        return {
            "risk_level": risk_class,
            "risk_score": round(risk_score, 3),
            "confidence": round(confidence, 3),
            "probabilities": {classes[i]: round(float(p), 4) for i, p in enumerate(probas)},
            "primary_drivers": top_drivers,
        }
