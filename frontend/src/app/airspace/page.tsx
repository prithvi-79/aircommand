"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Plane,
  Radio,
  Wind,
  Warehouse,
  ShieldAlert,
  Compass,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { getBases, getFleet } from "@/lib/api";

export default function AirspacePage() {
  const [bases, setBases] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [selectedBase, setSelectedBase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBases(), getFleet()])
      .then(([bList, fList]) => {
        setBases(bList);
        setFleet(fList);
        if (bList.length > 0) setSelectedBase(bList[0]);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notion Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Airspace & Forward Operating Wings</h1>
          <p className="text-xs text-ink-steel mt-0.5">
            Tactical sector radar grid · Base meteorological envelopes & runway throughput limits
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Tactical Visualizer Box */}
        <div className="lg:col-span-2 rounded-lg p-6 flex flex-col items-center justify-center relative min-h-[460px] overflow-hidden bg-navy border border-navy-mid shadow-card">
          {/* Radar Circles */}
          <div className="absolute w-[400px] h-[400px] rounded-full border border-navy-mid/60 pointer-events-none"></div>
          <div className="absolute w-[300px] h-[300px] rounded-full border border-navy-mid/50 pointer-events-none"></div>
          <div className="absolute w-[200px] h-[200px] rounded-full border border-navy-mid/40 pointer-events-none"></div>
          <div className="absolute w-[100px] h-[100px] rounded-full border border-navy-mid/50 pointer-events-none"></div>

          {/* Radar Sweep Line */}
          <div className="absolute w-[400px] h-[400px] pointer-events-none radar-sweep">
            <div className="w-[200px] h-[2px] bg-gradient-to-r from-transparent to-primary opacity-70"></div>
          </div>

          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-navy-mid/40 pointer-events-none"></div>
          <div className="absolute h-full w-[1px] bg-navy-mid/40 pointer-events-none"></div>

          {/* Bases Pinned on Grid */}
          <div className="relative w-full h-full min-h-[400px]">
            {bases.map((base, idx) => {
              const topPct = Math.max(10, Math.min(85, 100 - ((base.lat - 24) / (33 - 24)) * 80));
              const leftPct = Math.max(10, Math.min(85, ((base.lon - 71) / (91 - 71)) * 80));
              const isSelected = selectedBase?.id === base.id;

              return (
                <div
                  key={base.id}
                  onClick={() => setSelectedBase(base)}
                  style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                >
                  <div className="flex items-center space-x-1.5">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition ${
                        isSelected
                          ? "bg-primary border-white shadow-lg scale-125"
                          : "bg-navy-mid border-white/60 group-hover:scale-110"
                      }`}
                    >
                      <span className="w-1 h-1 rounded-full bg-white"></span>
                    </div>
                    <span
                      className={`text-[10px] font-sans px-2 py-0.5 rounded-sm border transition ${
                        isSelected
                          ? "bg-primary text-white border-primary font-semibold shadow-sm"
                          : "bg-navy-deep/90 text-white/90 border-navy-mid group-hover:border-white/50"
                      }`}
                    >
                      {base.name.split(" ")[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-3 left-3 text-[11px] font-sans text-white/60">
            Sector Meridian · Coordinates Synchronized
          </div>
        </div>

        {/* Selected Base Inspector Panel - Notion Card */}
        <div className="notion-card p-6 space-y-4 shadow-card">
          <div className="flex items-center space-x-2 border-b border-hairline pb-3">
            <Warehouse className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">Base Station Details</h2>
          </div>

          {selectedBase ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-ink">{selectedBase.name}</h3>
                <p className="text-xs text-ink-slate mt-0.5">
                  ID: <span className="font-semibold text-primary">{selectedBase.id}</span> · Lat: {selectedBase.lat}°N, Lon: {selectedBase.lon}°E
                </p>
              </div>

              {/* Weather Envelope */}
              <div className="bg-surface p-4 rounded-md border border-hairline space-y-2">
                <span className="text-[11px] font-semibold text-ink-steel uppercase flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-link-blue" />
                  Meteorological Envelope (METAR)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-ink-steel block text-[11px]">Crosswind:</span>
                    <span className="text-ink font-semibold">{selectedBase.weather?.crosswind_knots || 8} knots</span>
                  </div>
                  <div>
                    <span className="text-ink-steel block text-[11px]">Cloud Ceiling:</span>
                    <span className="text-ink font-semibold">{selectedBase.weather?.ceiling_ft || 4500} ft</span>
                  </div>
                  <div>
                    <span className="text-ink-steel block text-[11px]">Visibility:</span>
                    <span className="text-ink font-semibold">{selectedBase.weather?.visibility_km || 10} km</span>
                  </div>
                  <div>
                    <span className="text-ink-steel block text-[11px]">Condition:</span>
                    <span className="text-brand-green font-semibold">{selectedBase.weather?.condition || "CAVOK"}</span>
                  </div>
                </div>
              </div>

              {/* Runway Capacity & Throughput */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-slate">Runways:</span>
                  <span className="text-ink font-semibold">{selectedBase.runways?.join(", ") || "12L/30R"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-slate">Launch Ceiling (15m):</span>
                  <span className="text-ink font-semibold">{selectedBase.launch_rate_15m} sorties / window</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-slate">Recovery Rate (15m):</span>
                  <span className="text-ink font-semibold">{selectedBase.recovery_rate_15m} sorties / window</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-slate">ATF Fuel Buffer:</span>
                  <span className="text-brand-green font-semibold">{selectedBase.fuel_state}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-slate">Hangar Parking Slots:</span>
                  <span className="text-ink font-semibold">{selectedBase.parking} slots</span>
                </div>
              </div>

              {/* Stationed Aircraft */}
              <div className="pt-3 border-t border-hairline">
                <span className="text-[11px] font-semibold text-ink-steel uppercase block mb-2">
                  Stationed Aircraft ({fleet.filter((a) => a.base_id === selectedBase.id).length})
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {fleet
                    .filter((a) => a.base_id === selectedBase.id)
                    .map((ac) => (
                      <span
                        key={ac.tail}
                        className="px-2 py-0.5 rounded-sm bg-surface border border-hairline text-ink-charcoal font-medium"
                      >
                        {ac.tail} ({ac.type_id})
                      </span>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-ink-steel text-xs">Select a base on the tactical radar.</div>
          )}
        </div>
      </div>
    </div>
  );
}
