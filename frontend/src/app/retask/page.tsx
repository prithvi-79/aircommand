"use client";

import React, { useState, useEffect } from "react";
import {
  Shuffle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Plane,
  RefreshCw,
  TrendingDown,
  Layers,
  ChevronRight,
  Check
} from "lucide-react";
import { getEvents, getCoas, injectDisruption, applyCoa } from "@/lib/api";

const CONTINGENCY_TEMPLATES = [
  {
    type: "WEATHER_DEGRADATION",
    title: "Convective Squall (Weather Front)",
    desc: "Severe squall over Ambala AFS. Crosswinds spike to 36kt, cloud ceiling falls to 200ft.",
    payload: { base_name: "Ambala AFS", crosswind_knots: 36, ceiling_ft: 200 },
    badge: "Meteorological",
    badgeColor: "bg-tint-sky text-link-blue",
  },
  {
    type: "AIRCRAFT_ANOMALY",
    title: "Turbine Thermal Surge (In-Flight)",
    desc: "Su-30MKI (SB-121) reports compressor stage thermal spike (842°C). High risk of stall.",
    payload: { tail: "SB-121", anomaly: "Turbine stage 2 thermal surge (842°C)", subsystem: "ENG-1" },
    badge: "Propulsion",
    badgeColor: "bg-tint-rose text-brand-pink-deep",
  },
  {
    type: "RUNWAY_CLOSURE",
    title: "Runway UXO / Cratering",
    desc: "Runway 13/31 at Halwara AFS closed due to suspected runway cratering. Launch rate 0.",
    payload: { base_name: "Halwara AFS", runway: "13/31" },
    badge: "Airbase",
    badgeColor: "bg-tint-peach text-brand-orange-deep",
  },
  {
    type: "THREAT_SPIKE",
    title: "SAM Radar Intercept (Threat Spike)",
    desc: "High-altitude enemy SAM lock in Northern Ridge Sector. Compromises Corridor 12.",
    payload: { zone: "Northern Ridge Sector", emitter: "SURFACE_TO_AIR_RADAR" },
    badge: "Electronic EW",
    badgeColor: "bg-tint-lavender text-brand-purple-800",
  },
];

export default function DisruptionLabPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [coas, setCoas] = useState<any[]>([]);
  const [selectedCoa, setSelectedCoa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [injecting, setInjecting] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([getEvents(), getCoas()])
      .then(([evs, cs]) => {
        setEvents(evs);
        setCoas(cs);
        if (cs.length > 0) {
          const rec = cs.find((c: any) => c.recommended) || cs[0];
          setSelectedCoa(rec);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInject = async (tpl: any) => {
    setInjecting(true);
    setActionMsg(null);
    try {
      const res = await injectDisruption(tpl.type, "HIGH", tpl.payload);
      setActionMsg(`Contingency scenario "${tpl.title}" injected into tactical theatre.`);
      loadData();
    } catch (err: any) {
      setActionMsg(`Injection error: ${err.message}`);
    } finally {
      setInjecting(false);
    }
  };

  const handleApply = async (coaId: string) => {
    setActionMsg(null);
    try {
      const res = await applyCoa(coaId);
      setActionMsg(`Commander formally adopted COA ${coaId}. Disruption resolved and recorded in audit ledger.`);
      loadData();
    } catch (err: any) {
      setActionMsg(`Apply error: ${err.message}`);
    }
  };

  const latestEvent = events[0];
  const causal = selectedCoa?.causal_chain || latestEvent?.causal_chain;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notion Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Dynamic Retasking & Disruption Lab</h1>
          <p className="text-xs text-ink-steel mt-0.5">
            Contingency scenario injector · Server-side ranked Courses of Action (COAs) & Causal Impact Chains
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="notion-btn-ghost text-xs border border-hairline"
            title="Refresh State"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMsg && (
        <div className="p-3.5 rounded-lg bg-tint-mint border border-brand-green/30 text-brand-green text-xs flex items-center justify-between font-sans shadow-subtle">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium text-ink-charcoal">{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-ink-charcoal hover:text-ink">✕</button>
        </div>
      )}

      {/* Contingency Injector Section */}
      <div className="notion-card p-6 space-y-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shuffle className="w-4 h-4 text-brand-orange" />
            <h2 className="text-sm font-semibold text-ink">Inject Operational Contingency Scenario</h2>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-tint-peach text-brand-orange-deep">
            Real-Time Sim
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {CONTINGENCY_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleInject(tpl)}
              disabled={injecting}
              className="p-4 rounded-lg bg-surface hover:bg-hairline-soft border border-hairline text-left transition group space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${tpl.badgeColor}`}>
                  {tpl.badge}
                </span>
                <ChevronRight className="w-4 h-4 text-ink-stone group-hover:text-primary transition" />
              </div>
              <h3 className="text-xs font-semibold text-ink group-hover:text-primary transition">{tpl.title}</h3>
              <p className="text-[11px] text-ink-slate leading-relaxed">{tpl.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Disruption & Causal Chain Panel - Notion Bold Yellow Banner */}
      {causal && (
        <div className="p-6 rounded-lg bg-tint-yellow-bold border border-brand-yellow space-y-4 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-yellow/60 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-brand-orange-deep" />
              <h2 className="text-sm font-bold text-ink-deep">
                AERIS Causal Impact Chain: {latestEvent?.type || "ACTIVE_CONTINGENCY"}
              </h2>
            </div>
            <div className="flex items-center space-x-4 text-xs font-sans">
              <span className="text-ink-charcoal">Baseline Readiness: <strong>{causal.baseline_readiness}%</strong></span>
              <span className="text-brand-orange-deep font-bold">Simulated: {causal.simulated_readiness}%</span>
              <span className="text-semantic-error font-bold">({causal.readiness_delta}%)</span>
            </div>
          </div>

          {/* 4-Step Causal Chain Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-md bg-white border border-brand-yellow/40 shadow-subtle">
              <div className="text-[11px] font-bold text-link-blue uppercase tracking-wider mb-1">
                1. What Changed
              </div>
              <p className="text-xs text-ink-charcoal leading-relaxed">{causal.what_changed}</p>
            </div>
            <div className="p-3.5 rounded-md bg-white border border-brand-yellow/40 shadow-subtle">
              <div className="text-[11px] font-bold text-brand-orange-deep uppercase tracking-wider mb-1">
                2. What Was Affected
              </div>
              <p className="text-xs text-ink-charcoal leading-relaxed">{causal.what_affected}</p>
            </div>
            <div className="p-3.5 rounded-md bg-white border border-brand-yellow/40 shadow-subtle">
              <div className="text-[11px] font-bold text-brand-purple-800 uppercase tracking-wider mb-1">
                3. Root Cause Rule
              </div>
              <p className="text-xs text-ink-charcoal leading-relaxed">{causal.why}</p>
            </div>
            <div className="p-3.5 rounded-md bg-white border border-brand-yellow/40 shadow-subtle">
              <div className="text-[11px] font-bold text-semantic-error uppercase tracking-wider mb-1">
                4. System State Shift
              </div>
              <p className="text-xs text-ink-charcoal leading-relaxed">{causal.resulting_impact}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4 Ranked Courses of Action (COAs) - Notion Pricing-Card Style */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">
              Four Ranked Courses of Action (COAs)
            </h2>
          </div>
          <span className="text-xs text-ink-steel">Server-Side Multi-Objective Scored</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {coas.map((c) => {
            const isSelected = selectedCoa?.id === c.id;
            const isRec = c.recommended;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCoa(c)}
                className={`notion-card p-5 flex flex-col justify-between cursor-pointer transition relative ${
                  isRec
                    ? "border-2 border-primary bg-surface shadow-card"
                    : isSelected
                    ? "border-primary bg-canvas shadow-card"
                    : "hover:border-hairline-strong bg-canvas"
                }`}
              >
                {isRec && (
                  <div className="absolute -top-3 right-4 bg-primary text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                    RECOMMENDED
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-stone">Rank #{c.rank}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-sm bg-surface border border-hairline text-ink-slate font-medium">
                      {c.preset}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-ink">{c.name}</h3>
                  <p className="text-xs text-ink-slate leading-relaxed">{c.rationale}</p>

                  <div className="pt-2.5 border-t border-hairline space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-ink-steel">Stability Score:</span>
                      <span className="text-ink font-semibold">{c.metrics?.stability_score}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-steel">Mission Fulfilment:</span>
                      <span className="text-ink font-semibold">{c.metrics?.mission_fulfilment}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-steel">ML Risk Factor:</span>
                      <span className={c.metrics?.risk_score < 0.2 ? "text-brand-green font-semibold" : "text-brand-orange-deep font-semibold"}>
                        {c.metrics?.risk_score}
                      </span>
                    </div>
                  </div>

                  {/* Diff actions */}
                  {c.diff && c.diff.length > 0 && (
                    <div className="pt-2 border-t border-hairline space-y-1">
                      {c.diff.map((df: any, idx: number) => (
                        <div key={idx} className="text-[11px] text-ink-charcoal flex items-start gap-1.5">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-tint-lavender text-brand-purple-800">
                            {df.action}
                          </span>
                          <span className="leading-tight">{df.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(c.id);
                    }}
                    className={`w-full text-xs font-medium ${
                      isRec
                        ? "notion-btn-primary py-2"
                        : "notion-btn-secondary py-2"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>Authorize & Adopt</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
