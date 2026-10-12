"use client";

import React, { useState } from "react";
import { X, Sparkles, Send, ShieldCheck, CheckCircle2, MessageSquare, AlertTriangle } from "lucide-react";
import { askCopilot } from "@/lib/api";

const PRESET_QUERIES = [
  "What is the current fleet readiness and active plan?",
  "Why did readiness change after the recent disruption?",
  "What operational constraints are currently active?",
  "Recommend next action for the Air Commander",
];

export function CopilotDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "copilot",
      text: "Greetings, Commander. I am your grounded C2 Tactical Copilot. I analyze live telemetry, OR-Tools CP-SAT schedules, and trained Random Forest models. Ask any operational question or select an inquiry below.",
      evidence: ["Real-time state fusion active", "OR-Tools Solver ready"],
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (qToSend?: string) => {
    const text = qToSend || query;
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setQuery("");
    setLoading(true);

    try {
      const res = await askCopilot(text);
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: res.answer,
          evidence: res.grounded_evidence,
          confidence: res.confidence,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: `Tactical advisory error: ${err.message || "Failed to reach decision support service."}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 sm:w-[460px] bg-canvas border-l border-hairline shadow-modal z-50 flex flex-col justify-between select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-hairline flex items-center justify-between bg-canvas">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-md bg-tint-lavender flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">C2 Tactical Copilot</h3>
            <p className="text-[12px] text-ink-steel">Grounded Decision Intelligence</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-ink-steel hover:text-ink hover:bg-surface transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-soft">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] p-3.5 rounded-lg text-xs leading-relaxed shadow-subtle ${
                m.sender === "user"
                  ? "bg-ink-deep text-white"
                  : m.isError
                  ? "bg-tint-rose border border-semantic-error/40 text-semantic-error"
                  : "bg-canvas border border-hairline text-ink-charcoal"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.evidence && m.evidence.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-hairline-soft">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Grounded Evidence Citations
                  </p>
                  <ul className="text-[11px] text-ink-slate space-y-1">
                    {m.evidence.map((ev: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-primary font-medium py-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span>Synthesizing operational telemetry...</span>
          </div>
        )}
      </div>

      {/* Preset Query Chips */}
      <div className="p-3 border-t border-hairline bg-surface">
        <div className="text-[11px] font-semibold text-ink-stone uppercase tracking-wider mb-2">
          Tactical Quick Inquiries
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUERIES.map((pq, i) => (
            <button
              key={i}
              onClick={() => handleSend(pq)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-canvas hover:bg-hairline-soft text-ink-slate border border-hairline transition text-left shadow-subtle"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-canvas border-t border-hairline">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask tactical C2 question..."
            className="flex-1 bg-canvas border border-hairline-strong focus:border-primary rounded-md px-3 py-2 text-xs text-ink outline-none transition"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="notion-btn-primary p-2 text-xs flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
