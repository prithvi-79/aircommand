"use client";

import React, { useState, useEffect } from "react";
import {
  ScrollText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  Lock,
  Search
} from "lucide-react";
import { getAuditEntries, verifyAuditChain } from "@/lib/api";

export default function AuditPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = () => {
    setLoading(true);
    getAuditEntries()
      .then(setEntries)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await verifyAuditChain();
      setVerifyResult(res);
    } catch (err: any) {
      setVerifyResult({ valid: false, message: `Verification failed: ${err.message}` });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notion Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Cryptographic Audit Ledger</h1>
          <p className="text-xs text-ink-steel mt-0.5">
            Tamper-evident SHA-256 hash-chained immutable audit trail · Military governance & independent verification
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="notion-btn-ghost text-xs border border-hairline"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="notion-btn-primary text-xs flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{verifying ? "Computing Hashes..." : "Verify Chain Integrity"}</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner - Notion Mint or Rose Tint */}
      {verifyResult && (
        <div
          className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-subtle ${
            verifyResult.valid
              ? "bg-tint-mint border-brand-green/30 text-ink-charcoal"
              : "bg-tint-rose border-semantic-error/30 text-semantic-error"
          }`}
        >
          <div className="flex items-center space-x-3">
            {verifyResult.valid ? (
              <CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-semantic-error flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold text-sm text-ink">
                {verifyResult.valid ? "CRYPTOGRAPHIC PROOF: INTEGRITY VALID" : "HASH DISCREPANCY DETECTED"}
              </p>
              <p className="text-xs text-ink-slate mt-0.5">{verifyResult.message}</p>
            </div>
          </div>
          {verifyResult.latest_hash && (
            <div className="text-right text-[11px] text-ink-steel font-mono">
              <span>Top Hash: </span>
              <span className="text-primary font-semibold">{verifyResult.latest_hash.slice(0, 16)}...</span>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Table - Notion Table Style */}
      <div className="notion-card overflow-hidden shadow-card">
        <div className="p-4 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">
              Immutable Audit Ledger Records ({entries.length} Blocks)
            </h2>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ink-stone absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search actions or refs..."
              className="bg-canvas border border-hairline focus:border-primary rounded-md pl-8 pr-3 py-1.5 text-xs text-ink outline-none w-60 transition font-sans"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-surface-soft text-ink-steel uppercase tracking-wider text-[11px] font-medium">
                <th className="py-3 px-4">Seq</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Entity Reference</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Previous Hash</th>
                <th className="py-3 px-4">Current Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft font-sans">
              {entries
                .filter(
                  (e) =>
                    !searchTerm ||
                    e.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.actor.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((entry) => (
                  <tr key={entry.seq} className="hover:bg-surface transition">
                    <td className="py-3 px-4 text-primary font-mono font-medium">#{entry.seq}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-tint-lavender text-brand-purple-800">
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ink font-medium">{entry.actor}</td>
                    <td className="py-3 px-4 text-link-blue font-mono">{entry.ref}</td>
                    <td className="py-3 px-4 text-ink-steel text-[11px] font-mono">
                      {entry.at ? entry.at.slice(0, 19).replace("T", " ") : "--"}
                    </td>
                    <td className="py-3 px-4 text-ink-slate max-w-xs truncate" title={entry.reason}>
                      {entry.reason || "--"}
                    </td>
                    <td className="py-3 px-4 text-ink-stone font-mono text-[10px]" title={entry.prev_hash}>
                      {entry.prev_hash?.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-brand-green font-mono text-[10px]" title={entry.hash}>
                      {entry.hash?.slice(0, 8)}...
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
