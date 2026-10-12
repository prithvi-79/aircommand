"use client";

import React, { useState, useEffect } from "react";
import {
  Plane,
  Users,
  SquareStack,
  ClipboardList,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers
} from "lucide-react";
import { getFleet, getCrew, getStores, getMissions } from "@/lib/api";

export default function RegistersPage() {
  const [activeTab, setActiveTab] = useState<"fleet" | "crew" | "stores" | "missions">("fleet");
  const [fleet, setFleet] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([getFleet(), getCrew(), getStores(), getMissions()])
      .then(([f, c, s, m]) => {
        setFleet(f);
        setCrew(c);
        setStores(s);
        setMissions(m);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notion Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Tactical Asset Registers</h1>
          <p className="text-xs text-ink-steel mt-0.5">
            Operational database registers for aircraft fleet, aircrew rosters, logistics depots, and missions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="notion-btn-ghost text-xs border border-hairline"
            title="Refresh Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notion Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "fleet", label: `Fleet (${fleet.length})`, icon: Plane },
            { id: "crew", label: `Aircrew (${crew.length})`, icon: Users },
            { id: "stores", label: `Logistics Stores (${stores.length})`, icon: SquareStack },
            { id: "missions", label: `Missions (${missions.length})`, icon: ClipboardList },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs transition border ${
                  isActive
                    ? "bg-ink-deep text-white border-ink-deep font-semibold shadow-sm"
                    : "bg-canvas text-ink-steel border-hairline hover:bg-surface hover:text-ink"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-ink-stone absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search register..."
            className="bg-surface border border-hairline focus:border-primary rounded-md pl-9 pr-3 py-1.5 text-xs text-ink outline-none w-64 transition"
          />
        </div>
      </div>

      {/* Fleet Table */}
      {activeTab === "fleet" && (
        <div className="notion-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft text-ink-steel uppercase tracking-wider text-[11px] font-medium">
                  <th className="py-3 px-4">Tail Number</th>
                  <th className="py-3 px-4">Airframe Model</th>
                  <th className="py-3 px-4">Home Base</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Engine Health</th>
                  <th className="py-3 px-4">Turbine Temp</th>
                  <th className="py-3 px-4">Fuel Level</th>
                  <th className="py-3 px-4">Flight Hours</th>
                  <th className="py-3 px-4">Inspection Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-sans">
                {fleet
                  .filter((a) => !searchTerm || a.tail.toLowerCase().includes(searchTerm.toLowerCase()) || a.type_id.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((ac) => (
                    <tr key={ac.tail} className="hover:bg-surface transition">
                      <td className="py-3 px-4 font-mono font-medium text-primary">{ac.tail}</td>
                      <td className="py-3 px-4 text-ink font-medium">{ac.type_id}</td>
                      <td className="py-3 px-4 text-ink-slate">{ac.base_id}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold ${
                            ac.status === "FMC"
                              ? "bg-tint-mint text-brand-green"
                              : ac.status === "PMC"
                              ? "bg-tint-peach text-brand-orange-deep"
                              : "bg-tint-rose text-semantic-error"
                          }`}
                        >
                          {ac.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-ink">{ac.readiness}%</td>
                      <td className="py-3 px-4 text-ink-slate">{ac.engine_health}%</td>
                      <td className="py-3 px-4 text-brand-orange font-mono">{ac.engine_temp}°C</td>
                      <td className="py-3 px-4 text-ink-slate">{ac.fuel_level}%</td>
                      <td className="py-3 px-4 text-ink-steel font-mono">{ac.flight_hours} hrs</td>
                      <td className="py-3 px-4 text-ink-steel font-mono">{ac.hours_to_inspection} hrs</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Crew Table */}
      {activeTab === "crew" && (
        <div className="notion-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft text-ink-steel uppercase tracking-wider text-[11px] font-medium">
                  <th className="py-3 px-4">Officer Name</th>
                  <th className="py-3 px-4">Rank / Call</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Station Base</th>
                  <th className="py-3 px-4">24h Flight Hours</th>
                  <th className="py-3 px-4">7d Flight Hours</th>
                  <th className="py-3 px-4">Fatigue Index</th>
                  <th className="py-3 px-4">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-sans">
                {crew
                  .filter((c) => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((cr) => (
                    <tr key={cr.id} className="hover:bg-surface transition">
                      <td className="py-3 px-4 font-semibold text-ink">{cr.name}</td>
                      <td className="py-3 px-4 text-ink-slate">{cr.rank}</td>
                      <td className="py-3 px-4 text-primary font-medium">{cr.role}</td>
                      <td className="py-3 px-4 text-ink-slate">{cr.base_id}</td>
                      <td className="py-3 px-4 text-ink-charcoal font-mono">{cr.hours_24h}h / 8h</td>
                      <td className="py-3 px-4 text-ink-steel font-mono">{cr.hours_7d}h</td>
                      <td className="py-3 px-4 text-ink-charcoal font-mono">{cr.fatigue_index}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold ${
                            cr.status === "AVAILABLE"
                              ? "bg-tint-mint text-brand-green"
                              : "bg-tint-peach text-brand-orange-deep"
                          }`}
                        >
                          {cr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stores Table */}
      {activeTab === "stores" && (
        <div className="notion-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft text-ink-steel uppercase tracking-wider text-[11px] font-medium">
                  <th className="py-3 px-4">Store Code</th>
                  <th className="py-3 px-4">Designation / Munition</th>
                  <th className="py-3 px-4">Operating Base</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Available Qty</th>
                  <th className="py-3 px-4">Safety Reserve Minimum</th>
                  <th className="py-3 px-4">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-sans">
                {stores
                  .filter((s) => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((st) => (
                    <tr key={st.id} className="hover:bg-surface transition">
                      <td className="py-3 px-4 font-mono font-medium text-primary">{st.code}</td>
                      <td className="py-3 px-4 font-semibold text-ink">{st.name}</td>
                      <td className="py-3 px-4 text-ink-slate">{st.base_id}</td>
                      <td className="py-3 px-4 text-ink-steel">{st.category}</td>
                      <td className="py-3 px-4 font-semibold text-ink">{st.qty} {st.unit}</td>
                      <td className="py-3 px-4 text-ink-steel font-mono">{st.reserve_min} {st.unit}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-tint-mint text-brand-green">
                          {st.qty >= st.reserve_min ? "SUFFICIENT BUFFER" : "CRITICAL BUFFER"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Missions Table */}
      {activeTab === "missions" && (
        <div className="notion-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft text-ink-steel uppercase tracking-wider text-[11px] font-medium">
                  <th className="py-3 px-4">Mission ID</th>
                  <th className="py-3 px-4">Mission Call / Name</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Base Wing</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Required Aircraft</th>
                  <th className="py-3 px-4">Designated Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-sans">
                {missions
                  .filter((m) => !searchTerm || m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.id.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((ms) => (
                    <tr key={ms.id} className="hover:bg-surface transition">
                      <td className="py-3 px-4 font-mono font-medium text-primary">{ms.id}</td>
                      <td className="py-3 px-4 font-semibold text-ink">{ms.name}</td>
                      <td className="py-3 px-4 text-ink-slate">{ms.type}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold ${
                            ms.priority === 1
                              ? "bg-tint-rose text-semantic-error"
                              : "bg-tint-sky text-link-blue"
                          }`}
                        >
                          P{ms.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-ink-slate">{ms.base_id}</td>
                      <td className="py-3 px-4 text-ink-steel font-mono">{ms.duration_min} min</td>
                      <td className="py-3 px-4 text-ink font-medium">{ms.aircraft_required} fighters</td>
                      <td className="py-3 px-4 text-ink-steel">{ms.target_zone}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
