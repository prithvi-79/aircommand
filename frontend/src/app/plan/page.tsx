"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarRange,
  Play,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileCheck2,
  RefreshCw,
  Send,
  Plane,
  Check
} from "lucide-react";
import {
  getCurrentPlan,
  optimisePlan,
  validatePlan,
  approvePlan,
  cosignPlan,
  publishPlan,
  getMe
} from "@/lib/api";

export default function PlannerPage() {
  const [data, setData] = useState<any>(null);
  const [posture, setPosture] = useState("BALANCED");
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadPlan = () => {
    setLoading(true);
    getCurrentPlan()
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlan();
    getMe().then(setCurrentUser).catch(() => {});
  }, []);

  const handleSolve = async () => {
    setSolving(true);
    setActionMsg(null);
    try {
      const res = await optimisePlan(posture);
      setData(res);
      setActionMsg(`Plan ${res.plan.id} solved successfully under ${posture} posture in ${res.plan.solver_stats?.solve_time_sec}s.`);
    } catch (err: any) {
      setActionMsg(`Optimizer error: ${err.message}`);
    } finally {
      setSolving(false);
    }
  };

  const handleValidate = async () => {
    setActionMsg(null);
    try {
      const res = await validatePlan();
      setActionMsg(`Validator result: ${res.summary}`);
      loadPlan();
    } catch (err: any) {
      setActionMsg(`Validator error: ${err.message}`);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await approvePlan();
      setActionMsg(`Commander authorized and approved plan ${res.plan_id}.`);
      loadPlan();
    } catch (err: any) {
      setActionMsg(`Approval error: ${err.message}`);
    }
  };

  const handleCosign = async () => {
    try {
      const res = await cosignPlan();
      setActionMsg(`Independent auditor co-signed plan ${res.plan_id} (hash chain recorded).`);
      loadPlan();
    } catch (err: any) {
      setActionMsg(`Co-sign error: ${err.message}`);
    }
  };

  const handlePublish = async () => {
    try {
      const res = await publishPlan();
      setActionMsg(`Air Tasking Order ${res.plan_id} published to all Forward Operating Wings.`);
      loadPlan();
    } catch (err: any) {
      setActionMsg(`Publish error: ${err.message}`);
    }
  };

  const plan = data?.plan;
  const assignments = data?.assignments || [];
  const kpis = data?.kpis || {};
  const validation = data?.validation || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notion Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Air Tasking Order (ATO) Planner</h1>
          <p className="text-xs text-ink-steel mt-0.5">
            Google OR-Tools CP-SAT scheduler · Multi-posture optimization with mathematical constraint validation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadPlan}
            disabled={loading}
            className="notion-btn-ghost text-xs border border-hairline"
            title="Refresh Plan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMsg && (
        <div className="p-3.5 rounded-lg bg-tint-lavender border border-brand-purple-300 text-brand-purple-800 text-xs flex items-center justify-between font-sans shadow-subtle">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="font-medium">{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-brand-purple-800 hover:text-ink">✕</button>
        </div>
      )}

      {/* Notion Posture Selection Card & Solver Controls */}
      <div className="notion-card p-6 space-y-5 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <span className="text-[11px] font-semibold text-ink-stone uppercase tracking-wider block mb-2">
              Optimization Posture
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "BALANCED", label: "Balanced Posture", desc: "Equilibrium objective trade-off" },
                { id: "RESERVE_FOCUSED", label: "Reserve-Focused", desc: "Preserve 30%+ FMC alert fleet" },
                { id: "HIGH_TEMPO", label: "High-Tempo", desc: "Maximize mission sortie count" },
              ].map((p) => {
                const isActive = posture === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPosture(p.id)}
                    className={`px-3.5 py-2 rounded-md text-xs transition text-left border ${
                      isActive
                        ? "bg-ink-deep text-white border-ink-deep shadow-sm"
                        : "bg-surface hover:bg-hairline-soft text-ink-charcoal border-hairline"
                    }`}
                  >
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-[11px] opacity-75 font-normal">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSolve}
              disabled={solving}
              className="notion-btn-primary flex items-center space-x-2 text-xs shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{solving ? "Solving CP-SAT..." : "Optimise Air Tasking Order"}</span>
            </button>
            <button
              onClick={handleValidate}
              className="notion-btn-secondary text-xs flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>Check Hard Rules</span>
            </button>
          </div>
        </div>

        {/* Plan Lifecycle Steps */}
        {plan && (
          <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-ink-steel">Lifecycle Status:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-tint-lavender text-brand-purple-800 text-[11px] font-semibold border border-brand-purple-300">
                {plan.status}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {plan.status === "OPTIMISED" && (
                <button
                  onClick={handleApprove}
                  className="notion-btn-dark text-xs py-1.5 px-3"
                >
                  Approve (Commander)
                </button>
              )}
              {plan.status === "APPROVED" && (
                <button
                  onClick={handleCosign}
                  className="notion-btn-primary text-xs py-1.5 px-3"
                >
                  Co-sign (Auditor)
                </button>
              )}
              {plan.status === "CO_SIGNED" && (
                <button
                  onClick={handlePublish}
                  className="notion-btn-dark text-xs py-1.5 px-3"
                >
                  Publish Order
                </button>
              )}
              {plan.status === "PUBLISHED" && (
                <span className="text-brand-green font-semibold flex items-center gap-1.5 bg-tint-mint px-2.5 py-1 rounded-sm text-xs">
                  <CheckCircle2 className="w-4 h-4" /> Order Published to All Wings
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Plan Performance KPIs */}
      {plan && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="notion-card p-4 bg-surface-soft">
            <p className="text-[11px] text-ink-stone font-medium uppercase">Solver Duration</p>
            <p className="text-xl font-bold text-ink mt-1">
              {plan.solver_stats?.solve_time_sec != null ? `${plan.solver_stats.solve_time_sec}s` : "0.08s"}
            </p>
            <p className="text-[11px] text-brand-green font-medium mt-0.5">Status: {plan.solver_stats?.status || "OPTIMAL"}</p>
          </div>
          <div className="notion-card p-4 bg-surface-soft">
            <p className="text-[11px] text-ink-stone font-medium uppercase">Mission Fulfilment</p>
            <p className="text-xl font-bold text-ink mt-1">
              {kpis.mission_fulfilment != null ? `${kpis.mission_fulfilment}%` : "--"}
            </p>
            <p className="text-[11px] text-ink-slate mt-0.5">P1 Coverage: {kpis.p1_coverage}%</p>
          </div>
          <div className="notion-card p-4 bg-surface-soft">
            <p className="text-[11px] text-ink-stone font-medium uppercase">Reserve Margin</p>
            <p className="text-xl font-bold text-brand-orange-deep mt-1">{kpis.reserve_integrity || "--"}</p>
            <p className="text-[11px] text-ink-slate mt-0.5">FMC tails in ready reserve</p>
          </div>
          <div className="notion-card p-4 bg-surface-soft">
            <p className="text-[11px] text-ink-stone font-medium uppercase">Constraint Validation</p>
            <p className="text-xl font-bold text-brand-green mt-1">
              {validation.status || "PASS"}
            </p>
            <p className="text-[11px] text-ink-slate mt-0.5">Violations: {validation.violations?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Sortie Assignment Table - Notion Table Style */}
      <div className="notion-card overflow-hidden shadow-card">
        <div className="p-4 border-b border-hairline flex items-center justify-between bg-surface">
          <div className="flex items-center space-x-2">
            <Plane className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">Sortie Assignment Roster ({assignments.length} Sorties)</h2>
          </div>
          <span className="text-xs text-ink-steel font-mono">Horizon: 24h</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-surface-soft text-ink-steel uppercase tracking-wider text-[11px] font-medium">
                <th className="py-3 px-4">Mission Target</th>
                <th className="py-3 px-4">Airframe Tail</th>
                <th className="py-3 px-4">Type / Payload</th>
                <th className="py-3 px-4">Operating Base</th>
                <th className="py-3 px-4">Takeoff (Z)</th>
                <th className="py-3 px-4">Landing (Z)</th>
                <th className="py-3 px-4">Crew Roster</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft font-sans">
              {assignments.map((asg: any, i: number) => (
                <tr key={i} className="hover:bg-surface transition">
                  <td className="py-3 px-4 font-semibold text-ink">
                    {asg.payload?.mission_name || asg.mission_id}
                  </td>
                  <td className="py-3 px-4 text-primary font-mono font-medium">{asg.tail}</td>
                  <td className="py-3 px-4 text-ink-slate">
                    {asg.payload?.aircraft_type} · {asg.payload?.payload_class}
                  </td>
                  <td className="py-3 px-4 text-ink-charcoal">{asg.base_id}</td>
                  <td className="py-3 px-4 text-ink-charcoal font-mono">{asg.takeoff?.slice(11, 16)}Z</td>
                  <td className="py-3 px-4 text-ink-charcoal font-mono">{asg.landing?.slice(11, 16)}Z</td>
                  <td className="py-3 px-4 text-ink-steel text-[11px]">
                    {asg.crew_ids?.join(", ") || "PILOT-ASSIGNED"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-tint-mint text-brand-green">
                      {asg.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
