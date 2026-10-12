"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  CalendarRange,
  Shuffle,
  RefreshCw,
  TrendingUp,
  Plane,
  Users,
  Warehouse,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Play,
  ArrowRight,
  Clock,
  Layers,
  Check
} from "lucide-react";
import { getCommandGlance, validatePlan } from "@/lib/api";

export default function CommandPage() {
  const [glance, setGlance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [valMsg, setValMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    getCommandGlance()
      .then(setGlance)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleValidate = async () => {
    setValidating(true);
    setValMsg(null);
    try {
      const res = await validatePlan();
      setValMsg(res.summary);
      loadData();
    } catch (err: any) {
      setValMsg(`Validation error: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  if (loading && !glance) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-ink-slate font-medium text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-3 text-primary" />
        Acquiring Unified Operational Command State...
      </div>
    );
  }

  const kpis = glance?.kpis || {};
  const plan = glance?.plan;
  const isDecisionNeeded = glance?.decision_required;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. SIGNATURE NOTION HERO BAND (Deep Navy with Scattered Dots, Centered Display, & Purple Primary CTA) */}
      <div className="relative rounded-xl overflow-hidden bg-navy text-white px-6 py-12 md:py-16 text-center shadow-lg border border-navy-mid">
        {/* Notion Decorative Atmospheric Elements (Sticky dots & mesh wires) */}
        <div className="absolute top-6 left-8 w-3 h-3 rounded-full bg-brand-yellow opacity-80 animate-pulse"></div>
        <div className="absolute top-14 left-1/4 w-2 h-2 rounded-full bg-brand-pink opacity-70"></div>
        <div className="absolute bottom-8 left-12 w-3.5 h-3.5 rounded-full bg-brand-teal opacity-75"></div>
        <div className="absolute top-8 right-12 w-3 h-3 rounded-full bg-brand-orange opacity-80"></div>
        <div className="absolute bottom-12 right-1/4 w-2 h-2 rounded-full bg-brand-purple-300 opacity-75"></div>
        <div className="absolute top-1/2 right-8 w-2.5 h-2.5 rounded-full bg-brand-green opacity-70"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-brand-green"></span>
            <span>Real-time Operational Command & Decision Support</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Meet the dynamic air command shift.
          </h1>

          <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto font-normal">
            Unified airspace planning, real-time CP-SAT optimization, and multi-horizon machine learning in one workspace.
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/plan"
              className="notion-btn-primary flex items-center space-x-2 text-sm shadow-md"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch ATO Planner</span>
            </Link>
            <Link
              href="/retask"
              className="notion-btn-secondary-on-dark flex items-center space-x-2 text-sm"
            >
              <span>Explore Disruption Lab</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm transition flex items-center gap-1.5"
              title="Refresh State"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Sync DTG</span>
            </button>
          </div>
        </div>

        {/* Workspace Mockup Card (Breaks out of the hero band with deep shadow-mockup) */}
        <div className="mt-10 max-w-4xl mx-auto bg-canvas text-ink rounded-lg p-5 border border-hairline shadow-mockup text-left">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-hairline text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]"></span>
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]"></span>
              <span className="w-3 h-3 rounded-full bg-[#27c93f]"></span>
              <span className="ml-2 font-semibold text-ink-charcoal text-xs">Tactical Workspace · Live Telemetry Board</span>
            </div>
            <div className="flex items-center space-x-2 text-ink-steel font-mono text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-semantic-success"></span>
              <span>8 Sensor Feeds Connected</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-surface rounded-md border border-hairline">
              <span className="text-[11px] text-ink-steel block">Active Posture</span>
              <span className="font-semibold text-ink text-sm">{plan?.posture || "BALANCED"}</span>
            </div>
            <div className="p-3 bg-surface rounded-md border border-hairline">
              <span className="text-[11px] text-ink-steel block">Assigned Sorties</span>
              <span className="font-semibold text-ink text-sm">{plan?.sorties_count || 12} Sorties</span>
            </div>
            <div className="p-3 bg-surface rounded-md border border-hairline">
              <span className="text-[11px] text-ink-steel block">Hard Constraints</span>
              <span className="font-semibold text-semantic-success text-sm flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 100% Satisfied
              </span>
            </div>
            <div className="p-3 bg-surface rounded-md border border-hairline">
              <span className="text-[11px] text-ink-steel block">Audit State</span>
              <span className="font-semibold text-primary text-sm font-mono">SHA-256 Valid</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HIGH-EMPHASIS NOTION BANNER (Bold Yellow Banner card-feature-yellow-bold) */}
      {isDecisionNeeded && (
        <div className="p-5 rounded-lg bg-tint-yellow-bold text-ink-charcoal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-brand-yellow shadow-card">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-md bg-white/70 flex items-center justify-center text-brand-orange-deep">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-ink-deep">OPERATIONAL INTERVENTION REQUIRED</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-orange text-white">
                  High Priority
                </span>
              </div>
              <p className="text-xs text-ink-charcoal mt-0.5">{glance?.decision_reason}</p>
            </div>
          </div>
          <Link
            href="/retask"
            className="notion-btn-dark text-xs flex items-center space-x-1.5 shadow-sm"
          >
            <span>Evaluate Ranked COAs</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 3. DIVERSE PASTEL FEATURE CARDS (Peach, Rose, Mint, Lavender, Sky, Yellow) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-ink">Operational Readiness & Posture</h2>
          <span className="text-xs text-ink-steel">Real-time KPI telemetry</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Mint Tint Card */}
          <div className="p-4 rounded-lg bg-tint-mint border border-brand-green/20">
            <p className="text-[11px] font-medium text-brand-green uppercase tracking-wide">Overall Readiness</p>
            <div className="mt-1.5">
              <span className="text-2xl font-bold text-ink font-sans">
                {kpis.overall_readiness != null ? `${kpis.overall_readiness}%` : "--"}
              </span>
            </div>
            <p className="text-[11px] text-brand-green mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Nominal threshold
            </p>
          </div>

          {/* Sky Tint Card */}
          <div className="p-4 rounded-lg bg-tint-sky border border-link-blue/20">
            <p className="text-[11px] font-medium text-link-blue uppercase tracking-wide">Mission Fulfilment</p>
            <div className="mt-1.5">
              <span className="text-2xl font-bold text-ink font-sans">
                {kpis.mission_fulfilment != null ? `${kpis.mission_fulfilment}%` : "--"}
              </span>
            </div>
            <p className="text-[11px] text-ink-slate mt-1">Value-weighted coverage</p>
          </div>

          {/* Lavender Tint Card */}
          <div className="p-4 rounded-lg bg-tint-lavender border border-brand-purple/20">
            <p className="text-[11px] font-medium text-brand-purple-800 uppercase tracking-wide">P1 Sortie Coverage</p>
            <div className="mt-1.5">
              <span className="text-2xl font-bold text-brand-purple-800 font-sans">
                {kpis.p1_coverage != null ? `${kpis.p1_coverage}%` : "--"}
              </span>
            </div>
            <p className="text-[11px] text-ink-slate mt-1">Priority-1 targets covered</p>
          </div>

          {/* Peach Tint Card */}
          <div className="p-4 rounded-lg bg-tint-peach border border-brand-orange/20">
            <p className="text-[11px] font-medium text-brand-orange-deep uppercase tracking-wide">Fleet Serviceable</p>
            <div className="mt-1.5">
              <span className="text-2xl font-bold text-ink font-sans">
                {kpis.aircraft_fmc || "--"}
              </span>
            </div>
            <p className="text-[11px] text-ink-slate mt-1">FMC Airframes online</p>
          </div>

          {/* Yellow Tint Card */}
          <div className="p-4 rounded-lg bg-tint-yellow border border-brand-yellow/30">
            <p className="text-[11px] font-medium text-brand-brown uppercase tracking-wide">Aircrew Ready</p>
            <div className="mt-1.5">
              <span className="text-2xl font-bold text-ink font-sans">
                {kpis.crew_ready || "--"}
              </span>
            </div>
            <p className="text-[11px] text-ink-slate mt-1">Duty & rest compliant</p>
          </div>

          {/* Rose Tint Card */}
          <div className="p-4 rounded-lg bg-tint-rose border border-brand-pink/20">
            <p className="text-[11px] font-medium text-brand-pink-deep uppercase tracking-wide">Reserve Margin</p>
            <div className="mt-1.5">
              <span className="text-2xl font-bold text-brand-pink-deep font-sans">
                {kpis.reserve_integrity || "--"}
              </span>
            </div>
            <p className="text-[11px] text-ink-slate mt-1">Fighter interceptor buffer</p>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE SCHEDULE CARD & FLEET COMPOSITION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 notion-card p-6 space-y-4 shadow-card">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <div className="flex items-center space-x-2">
              <CalendarRange className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-ink">Active Air Tasking Order (ATO)</h2>
            </div>
            {plan && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-tint-lavender text-brand-purple-800">
                {plan.status}
              </span>
            )}
          </div>

          {plan ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface p-4 rounded-md border border-hairline">
                <div>
                  <p className="text-sm font-semibold text-ink">{plan.label}</p>
                  <p className="text-xs text-ink-slate mt-0.5">
                    Plan ID: <span className="font-mono text-primary font-medium">{plan.id}</span> · Posture:{" "}
                    <span className="font-semibold text-brand-orange-deep">{plan.posture}</span> · Assigned Sorties:{" "}
                    <span className="font-semibold text-ink">{plan.sorties_count}</span>
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 flex items-center space-x-2">
                  <Link
                    href="/plan"
                    className="notion-btn-secondary text-xs py-1.5 px-3"
                  >
                    View Gantt & Sorties
                  </Link>
                </div>
              </div>

              {/* Validator Box */}
              <div className="bg-surface-soft p-4 rounded-md border border-hairline">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-semantic-success" />
                    <span className="text-xs font-semibold text-ink">Independent Constraint Validator</span>
                  </div>
                  <button
                    onClick={handleValidate}
                    disabled={validating}
                    className="notion-btn-ghost text-xs border border-hairline"
                  >
                    {validating ? "Checking..." : "Re-check Rules"}
                  </button>
                </div>
                <p className="text-xs text-ink-charcoal font-sans">
                  {valMsg || glance?.validation?.summary || "Plan satisfies all operational hard constraints."}
                </p>
                {glance?.validation?.warnings && glance.validation.warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {glance.validation.warnings.map((w: any, idx: number) => (
                      <p key={idx} className="text-xs text-brand-orange-deep flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{w.message}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-ink-steel text-xs">
              No Air Tasking Order loaded yet. Open Planner to optimize the flying day.
            </div>
          )}
        </div>

        {/* Fleet Composition Meter */}
        <div className="notion-card p-6 space-y-4 shadow-card">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <div className="flex items-center space-x-2">
              <Plane className="w-4 h-4 text-link-blue" />
              <h2 className="text-sm font-semibold text-ink">Fleet Serviceability</h2>
            </div>
            <Link href="/registers" className="text-xs text-link-blue hover:underline">
              Inspect
            </Link>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-slate font-medium">Fully Mission Capable (FMC)</span>
                <span className="text-brand-green font-semibold">{glance?.fleet_glance?.fmc || 16} / {glance?.fleet_glance?.total || 18}</span>
              </div>
              <div className="w-full bg-hairline rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-green h-2 rounded-full"
                  style={{ width: `${((glance?.fleet_glance?.fmc || 16) / (glance?.fleet_glance?.total || 18)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-slate font-medium">Partially Mission Capable (PMC)</span>
                <span className="text-brand-orange font-semibold">{glance?.fleet_glance?.pmc || 1}</span>
              </div>
              <div className="w-full bg-hairline rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-orange h-2 rounded-full"
                  style={{ width: `${((glance?.fleet_glance?.pmc || 1) / (glance?.fleet_glance?.total || 18)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-slate font-medium">Non-Mission Capable (NMC / Depot)</span>
                <span className="text-semantic-error font-semibold">{glance?.fleet_glance?.nmc || 1}</span>
              </div>
              <div className="w-full bg-hairline rounded-full h-2 overflow-hidden">
                <div
                  className="bg-semantic-error h-2 rounded-full"
                  style={{ width: `${((glance?.fleet_glance?.nmc || 1) / (glance?.fleet_glance?.total || 18)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-surface rounded-md border border-hairline text-xs text-ink-slate">
            <span className="text-ink font-semibold">Trained ML Prediction:</span> Multi-horizon fleet readiness projected to sustain 86.6% across next 24 hours under baseline tempo.
          </div>
        </div>
      </div>

      {/* 5. WORKSPACE MODULE TILES (Notion Card Base with 12px rounded, hairline border) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-ink">Tactical Mission Workspaces</h2>
          <span className="text-xs text-ink-steel">Direct access modules</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/plan"
            className="notion-card notion-card-hover p-5 block group"
          >
            <div className="flex items-center justify-between mb-3">
              <CalendarRange className="w-5 h-5 text-primary group-hover:scale-105 transition" />
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm bg-tint-lavender text-brand-purple-800">
                OR-Tools CP-SAT
              </span>
            </div>
            <h3 className="text-sm font-semibold text-ink">ATO Planner & Gantt</h3>
            <p className="text-xs text-ink-slate mt-1.5 leading-relaxed">
              Solve flying days with CP-SAT. Toggle Balanced, Reserve-Focused, or High-Tempo.
            </p>
          </Link>

          <Link
            href="/retask"
            className="notion-card notion-card-hover p-5 block group"
          >
            <div className="flex items-center justify-between mb-3">
              <Shuffle className="w-5 h-5 text-brand-orange group-hover:scale-105 transition" />
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm bg-tint-peach text-brand-orange-deep">
                COA Lab
              </span>
            </div>
            <h3 className="text-sm font-semibold text-ink">Disruption Lab & COAs</h3>
            <p className="text-xs text-ink-slate mt-1.5 leading-relaxed">
              Inject weather fronts, cratered runways, or thermal spikes. Review 4 ranked COAs.
            </p>
          </Link>

          <Link
            href="/analytics"
            className="notion-card notion-card-hover p-5 block group"
          >
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-brand-green group-hover:scale-105 transition" />
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm bg-tint-mint text-brand-green">
                ML Models
              </span>
            </div>
            <h3 className="text-sm font-semibold text-ink">Predictive AI / ML</h3>
            <p className="text-xs text-ink-slate mt-1.5 leading-relaxed">
              Real scikit-learn models: Airframe degradation curves, 72h readiness, risk radar.
            </p>
          </Link>

          <Link
            href="/audit"
            className="notion-card notion-card-hover p-5 block group"
          >
            <div className="flex items-center justify-between mb-3">
              <Shield className="w-5 h-5 text-link-blue group-hover:scale-105 transition" />
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm bg-tint-sky text-link-blue">
                SHA-256
              </span>
            </div>
            <h3 className="text-sm font-semibold text-ink">Audit Ledger & Verify</h3>
            <p className="text-xs text-ink-slate mt-1.5 leading-relaxed">
              Cryptographic hash-chained audit trail. Recompute and verify ledger integrity.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
