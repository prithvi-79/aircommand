"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Radio,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Power,
  TrendingDown,
  Layers,
  Inbox,
  Check
} from "lucide-react";
import { getFeeds, toggleFeed, getConflicts, resolveConflict } from "@/lib/api";

export default function SensorHubPage() {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([getFeeds(), getConflicts()])
      .then(([fList, cList]) => {
        setFeeds(fList);
        setConflicts(cList);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (feedId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "HEALTHY" ? "DEGRADED" : currentStatus === "DEGRADED" ? "OFFLINE" : "HEALTHY";
    try {
      const updated = await toggleFeed(feedId, nextStatus);
      setActionMsg(`Feed ${feedId} toggled to ${nextStatus}.`);
      loadData();
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleResolveConflict = async (id: number) => {
    try {
      await resolveConflict(id);
      setActionMsg(`Conflict #${id} resolved.`);
      loadData();
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notion Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Sensor Telemetry Fusion Hub (COP)</h1>
          <p className="text-xs text-ink-steel mt-0.5">
            Eight multi-source telemetry feeds · Health status toggling, anomaly conflict inbox, and latency metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="notion-btn-ghost text-xs border border-hairline"
            title="Refresh Feeds"
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

      {/* 8-Feed Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">Simulated Telemetry Ingress Feeds (8)</h2>
          </div>
          <span className="text-xs text-ink-steel font-medium">
            Online: {feeds.filter((f) => f.status === "HEALTHY").length}/8 Feeds
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {feeds.map((feed) => {
            const isHealthy = feed.status === "HEALTHY";
            const isDegraded = feed.status === "DEGRADED";
            const isOffline = feed.status === "OFFLINE";

            return (
              <div
                key={feed.id}
                className="notion-card p-5 flex flex-col justify-between space-y-3 shadow-card hover:border-hairline-strong transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-surface text-ink-slate border border-hairline">
                      {feed.category}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isHealthy
                          ? "bg-tint-mint text-brand-green"
                          : isDegraded
                          ? "bg-tint-peach text-brand-orange-deep"
                          : "bg-tint-rose text-semantic-error"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isHealthy ? "bg-brand-green" : isDegraded ? "bg-brand-orange" : "bg-semantic-error"
                        }`}
                      ></span>
                      {feed.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-ink">{feed.name}</h3>
                  <p className="text-[11px] text-primary font-mono mt-0.5">{feed.id}</p>

                  <div className="mt-2 text-xs text-ink-steel flex justify-between">
                    <span>Latency:</span>
                    <span className={feed.latency_ms > 200 ? "text-brand-orange-deep font-semibold" : "text-ink font-semibold"}>
                      {feed.latency_ms} ms
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-hairline">
                  <button
                    onClick={() => handleToggle(feed.id, feed.status)}
                    className="notion-btn-secondary w-full text-xs py-1.5 flex items-center justify-center space-x-1"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Toggle ({feed.status === "HEALTHY" ? "Degrade" : feed.status === "DEGRADED" ? "Take Offline" : "Restore"})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflict Inbox Panel */}
      <div className="notion-card overflow-hidden shadow-card">
        <div className="p-4 border-b border-hairline flex items-center justify-between bg-surface">
          <div className="flex items-center space-x-2">
            <Inbox className="w-4 h-4 text-brand-orange" />
            <h2 className="text-sm font-semibold text-ink">
              Sensor Conflict Inbox ({conflicts.filter((c) => !c.resolved).length} Unresolved)
            </h2>
          </div>
          <span className="text-xs text-ink-steel">Discrepancy Arbiter</span>
        </div>

        <div className="p-4 space-y-3">
          {conflicts.length > 0 ? (
            conflicts.map((conf) => (
              <div
                key={conf.id}
                className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${
                  conf.resolved
                    ? "bg-surface-soft border-hairline text-ink-muted opacity-60"
                    : "bg-tint-peach border-brand-orange/30 text-ink-charcoal"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-sm font-semibold ${
                        conf.severity === "CRITICAL"
                          ? "bg-tint-rose text-semantic-error"
                          : "bg-tint-yellow-bold text-brand-orange-deep"
                      }`}
                    >
                      {conf.severity}
                    </span>
                    <span className="text-ink-slate font-medium">Feed: {conf.feed_id}</span>
                    <span className="text-ink-steel font-mono">{conf.detected_at?.slice(11, 19)}Z</span>
                  </div>
                  <p className="text-xs text-ink font-sans">{conf.message}</p>
                  {conf.resolution && (
                    <p className="text-[11px] text-brand-green font-medium">Resolution: {conf.resolution}</p>
                  )}
                </div>

                {!conf.resolved && (
                  <button
                    onClick={() => handleResolveConflict(conf.id)}
                    className="notion-btn-dark text-xs py-1.5 px-3 flex items-center gap-1 self-start sm:self-auto shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-ink-steel text-xs">
              No active telemetry discrepancies detected. All feeds agree.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
