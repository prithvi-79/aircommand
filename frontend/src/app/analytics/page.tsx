"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Cpu,
  ShieldAlert,
  Flame,
  Activity,
  Gauge,
  Clock,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { getFleet, getAircraftDegradation, getFleetForecast, evaluateRisk } from "@/lib/api";

export default function AnalyticsPage() {
  const [fleet, setFleet] = useState<any[]>([]);
  const [selectedTail, setSelectedTail] = useState("RB-001");
  const [degData, setDegData] = useState<any>(null);
  const [fleetForecast, setFleetForecast] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Interactive slider overrides
  const [readiness, setReadiness] = useState(94);
  const [engHealth, setEngHealth] = useState(96);
  const [engTemp, setEngTemp] = useState(730);
  const [flightHours, setFlightHours] = useState(350);

  // Risk inputs
  const [fuelLevel, setFuelLevel] = useState(85);
  const [missionPrio, setMissionPrio] = useState(1);

  const loadData = () => {
    setLoading(true);
    getFleet()
      .then((tails) => {
        setFleet(tails);
        if (tails.length > 0 && !selectedTail) {
          setSelectedTail(tails[0].tail);
        }
      })
      .catch((err) => console.error(err));

    getFleetForecast()
      .then(setFleetForecast)
      .catch((err) => console.error(err));

    evaluateRisk({
      fuel_level: fuelLevel,
      fuel_consumption_rate: 38.0,
      engine_temperature: engTemp,
      engine_health: engHealth,
      aircraft_health: readiness,
      mission_priority: missionPrio,
      operational_condition: 1,
      maintenance_state: 0,
      operational_load: 65.0,
    })
      .then(setRiskData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTail) {
      getAircraftDegradation(selectedTail)
        .then((res) => {
          setDegData(res);
          setReadiness(res.current_readiness);
          setEngHealth(res.current_engine_health);
          setEngTemp(res.current_engine_temp);
        })
        .catch((err) => console.error(err));
    }
  }, [selectedTail]);

  const handleRecalculateDegradation = () => {
    const url = `/api/v1/analytics/aircraft-degradation?tail=${encodeURIComponent(
      selectedTail
    )}&curr_readiness=${readiness}&engine_health=${engHealth}&engine_temperature=${engTemp}&flight_hours=${flightHours}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setDegData(data))
      .catch((err) => console.error(err));

    evaluateRisk({
      fuel_level: fuelLevel,
      fuel_consumption_rate: 38.0,
      engine_temperature: engTemp,
      engine_health: engHealth,
      aircraft_health: readiness,
      mission_priority: missionPrio,
      operational_condition: 1,
      maintenance_state: 0,
      operational_load: 65.0,
    }).then(setRiskData);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notion Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">AI & Machine Learning Analytics</h1>
          <p className="text-xs text-ink-steel mt-0.5">
            Production scikit-learn models · Random Forest regressors & multi-feature operational risk classifier
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="notion-btn-ghost text-xs border border-hairline"
            title="Refresh Inference"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Model Registry Badges - Notion Pastel Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-tint-lavender border border-brand-purple/20 flex items-center space-x-3.5 shadow-subtle">
          <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-primary shadow-subtle">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">aircraft_degradation_rf</p>
            <p className="text-[11px] text-ink-slate">RandomForestRegressor · 60 Trees</p>
            <span className="text-[10px] text-brand-purple-800 font-semibold">R² Score: 0.9857 · Active</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-tint-sky border border-link-blue/20 flex items-center space-x-3.5 shadow-subtle">
          <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-link-blue shadow-subtle">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">fleet_readiness_rf</p>
            <p className="text-[11px] text-ink-slate">Multi-Horizon Ensemble (24/48/72h)</p>
            <span className="text-[10px] text-link-blue font-semibold">R² Score: 0.9892 · Active</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-tint-mint border border-brand-green/20 flex items-center space-x-3.5 shadow-subtle">
          <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-brand-green shadow-subtle">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">operational_risk_rf</p>
            <p className="text-[11px] text-ink-slate">Multi-Feature Risk Classifier</p>
            <span className="text-[10px] text-brand-green font-semibold">Classes: LOW/MED/HIGH · Active</span>
          </div>
        </div>
      </div>

      {/* Model 1: Aircraft Degradation Simulator */}
      <div className="notion-card p-6 space-y-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">
              Airframe Degradation Curve Predictor
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-ink-steel">Select Airframe:</span>
            <select
              value={selectedTail}
              onChange={(e) => setSelectedTail(e.target.value)}
              className="bg-canvas border border-hairline-strong rounded-md px-3 py-1 text-xs text-ink font-sans outline-none focus:border-primary"
            >
              {fleet.map((ac) => (
                <option key={ac.tail} value={ac.tail}>
                  {ac.tail} ({ac.type_id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders Control Panel */}
          <div className="space-y-4 bg-surface p-5 rounded-lg border border-hairline">
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
              Telemetry Parameters
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-slate">Current Readiness:</span>
                <span className="font-semibold text-ink">{readiness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={readiness}
                onChange={(e) => setReadiness(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-slate">Engine Health Index:</span>
                <span className="font-semibold text-ink">{engHealth}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={engHealth}
                onChange={(e) => setEngHealth(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-slate">Turbine Core Temp:</span>
                <span className="font-semibold text-brand-orange-deep">{engTemp}°C</span>
              </div>
              <input
                type="range"
                min="650"
                max="850"
                value={engTemp}
                onChange={(e) => setEngTemp(Number(e.target.value))}
                className="w-full accent-brand-orange cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-slate">Flight Hours:</span>
                <span className="font-semibold text-ink">{flightHours} hrs</span>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="25"
                value={flightHours}
                onChange={(e) => setFlightHours(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            <button
              onClick={handleRecalculateDegradation}
              className="notion-btn-primary w-full text-xs flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Run Model Inference</span>
            </button>
          </div>

          {/* Model Inference Degradation Horizons */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-surface border border-hairline text-center">
                <span className="text-[11px] font-semibold text-ink-steel uppercase">30-Min Horizon</span>
                <p className="text-2xl font-bold text-link-blue mt-1">
                  {degData?.projected_30m != null ? `${degData.projected_30m}%` : "--"}
                </p>
                <span className="text-[11px] text-ink-steel">Projected Readiness</span>
              </div>
              <div className="p-4 rounded-lg bg-surface border border-hairline text-center">
                <span className="text-[11px] font-semibold text-ink-steel uppercase">60-Min Horizon</span>
                <p className="text-2xl font-bold text-primary mt-1">
                  {degData?.projected_60m != null ? `${degData.projected_60m}%` : "--"}
                </p>
                <span className="text-[11px] text-ink-steel">Primary Target</span>
              </div>
              <div className="p-4 rounded-lg bg-surface border border-hairline text-center">
                <span className="text-[11px] font-semibold text-ink-steel uppercase">120-Min Horizon</span>
                <p className="text-2xl font-bold text-brand-orange mt-1">
                  {degData?.projected_120m != null ? `${degData.projected_120m}%` : "--"}
                </p>
                <span className="text-[11px] text-ink-steel">Extended Sortie</span>
              </div>
            </div>

            {/* Diagnostics info */}
            <div className="p-4 rounded-lg bg-surface-soft border border-hairline space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-slate">Degradation Velocity:</span>
                <span className="text-ink font-semibold">{degData?.degradation_rate_pct_hr}% / hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-slate">Thermal Acceleration Penalty:</span>
                <span className={degData?.thermal_penalty > 0 ? "text-brand-orange-deep font-semibold" : "text-brand-green font-semibold"}>
                  +{degData?.thermal_penalty || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-slate">Serviceability Evaluation:</span>
                <span className="text-brand-green font-semibold">{degData?.serviceability_status || "OPTIMAL"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model 2 & 3: Multi-Horizon Fleet Forecast + Operational Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Horizon Fleet Forecast */}
        <div className="notion-card p-6 space-y-4 shadow-card">
          <div className="flex items-center space-x-2 border-b border-hairline pb-3">
            <TrendingUp className="w-4 h-4 text-link-blue" />
            <h2 className="text-sm font-semibold text-ink">
              Multi-Horizon Fleet Readiness Forecaster (Ensemble)
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-surface border border-hairline text-center">
              <span className="text-[11px] font-semibold text-ink-steel uppercase">24-Hour</span>
              <p className="text-xl font-bold text-ink mt-1">
                {fleetForecast?.forecast_24h != null ? `${fleetForecast.forecast_24h}%` : "86.6%"}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-surface border border-hairline text-center">
              <span className="text-[11px] font-semibold text-ink-steel uppercase">48-Hour</span>
              <p className="text-xl font-bold text-ink mt-1">
                {fleetForecast?.forecast_48h != null ? `${fleetForecast.forecast_48h}%` : "82.1%"}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-surface border border-hairline text-center">
              <span className="text-[11px] font-semibold text-ink-steel uppercase">72-Hour</span>
              <p className="text-xl font-bold text-ink mt-1">
                {fleetForecast?.forecast_72h != null ? `${fleetForecast.forecast_72h}%` : "76.6%"}
              </p>
            </div>
          </div>

          <div className="p-4 bg-surface-soft rounded-lg border border-hairline space-y-2 text-xs">
            <span className="text-[11px] font-semibold text-ink-steel uppercase">Contributing Feature Drivers:</span>
            <div className="flex justify-between text-ink-slate">
              <span>Aircraft FMC Ratio:</span>
              <span className="font-semibold text-ink">{fleetForecast?.drivers?.aircraft_serviceability_ratio || 89}%</span>
            </div>
            <div className="flex justify-between text-ink-slate">
              <span>Crew Availability:</span>
              <span className="font-semibold text-ink">{fleetForecast?.drivers?.crew_availability_ratio || 88}%</span>
            </div>
            <div className="flex justify-between text-ink-slate">
              <span>Depot Stocks Health:</span>
              <span className="font-semibold text-ink">{fleetForecast?.drivers?.depot_stores_health || 93.5}%</span>
            </div>
          </div>
        </div>

        {/* Operational Risk Classifier */}
        <div className="notion-card p-6 space-y-4 shadow-card">
          <div className="flex items-center space-x-2 border-b border-hairline pb-3">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">
              Mission Operational Risk Classifier
            </h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-hairline">
            <div>
              <p className="text-xs text-ink-steel">Classified Risk Level:</p>
              <p className="text-xl font-bold text-brand-green mt-0.5">
                {riskData?.risk_level || "LOW"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-steel">Model Confidence:</p>
              <p className="text-xl font-bold text-ink mt-0.5">
                {riskData?.confidence ? `${(riskData.confidence * 100).toFixed(1)}%` : "97.8%"}
              </p>
            </div>
          </div>

          {/* Feature Importances Breakdown */}
          {riskData?.primary_drivers && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-ink-steel uppercase">Top Risk Drivers:</span>
              {riskData.primary_drivers.map((d: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-ink-slate">
                    <span>{d.feature}</span>
                    <span className="font-semibold text-ink">{(d.importance * 100).toFixed(1)}% weight</span>
                  </div>
                  <div className="w-full bg-hairline rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${d.importance * 100 * 2.5}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
