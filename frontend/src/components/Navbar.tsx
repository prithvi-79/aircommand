"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Sparkles, User, ChevronDown, Check, Clock, Radio, Activity } from "lucide-react";
import { demoLogin, getMe } from "@/lib/api";

const ROLES_LIST = [
  { id: "planner", name: "Ops Planner", title: "Wg Cdr A. Sharma (Planner)" },
  { id: "commander", name: "Air Commander", title: "Air Cdre R. Kapoor (Commander)" },
  { id: "auditor", name: "Auditor", title: "Col S. Mukherjee (Auditor)" },
  { id: "fleet", name: "Fleet Officer", title: "Sqn Ldr V. Nair (Fleet)" },
  { id: "crew", name: "Crew Officer", title: "Sqn Ldr P. Verma (Crew)" },
  { id: "analyst", name: "Intel Analyst", title: "Flt Lt K. Singh (Analyst)" },
  { id: "admin", name: "Administrator", title: "System Administrator" },
];

export function Navbar({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const [currentUser, setCurrentUser] = useState<any>({ role: "commander", name: "Air Cdre R. Kapoor" });
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    getMe().then(setCurrentUser).catch(() => {});
    const interval = setInterval(() => {
      const now = new Date();
      setTimeStr(`${now.toISOString().slice(11, 19)}Z · ${now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })} IST`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchRole = async (roleId: string) => {
    try {
      const res = await demoLogin(roleId);
      setCurrentUser(res.user);
      setRoleDropdownOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 bg-canvas border-b border-hairline px-6 flex items-center justify-between sticky top-0 z-40 select-none shadow-subtle">
      {/* Brand & ProjectX Identity */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-md bg-navy text-white flex items-center justify-center font-bold shadow-sm">
            <span className="font-mono text-sm tracking-tighter">PX</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-ink text-sm tracking-tight">ProjectX</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-tint-lavender text-brand-purple-800">
                SIH 26250 C2
              </span>
            </div>
            <p className="text-[12px] text-ink-steel font-normal leading-none mt-0.5">Air Operations Command</p>
          </div>
        </Link>
      </div>

      {/* Center Ticker: Telemetry and Zulu/IST Clock */}
      <div className="hidden lg:flex items-center space-x-3 text-xs text-ink-slate font-sans">
        <div className="flex items-center space-x-2 bg-surface px-3 py-1.5 rounded-md border border-hairline">
          <span className="w-2 h-2 rounded-full bg-semantic-success"></span>
          <span className="text-ink font-medium text-[12px]">System Operational</span>
        </div>
        <div className="flex items-center space-x-2 bg-surface px-3 py-1.5 rounded-md border border-hairline">
          <Radio className="w-3.5 h-3.5 text-link-blue" />
          <span className="text-ink-slate text-[12px]">Feeds 8/8 Lock</span>
        </div>
        <div className="flex items-center space-x-2 bg-surface px-3 py-1.5 rounded-md border border-hairline text-ink-charcoal font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-brand-orange" />
          <span>{timeStr || "SYNCING DTG..."}</span>
        </div>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center space-x-3">
        {/* C2 Copilot Button - Signature Notion Purple */}
        <button
          onClick={onOpenCopilot}
          className="notion-btn-primary flex items-center space-x-2 text-xs py-2 px-3.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>C2 Copilot</span>
        </button>

        {/* Role Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-canvas border border-hairline-strong hover:bg-surface text-xs text-ink transition shadow-subtle"
          >
            <div className="w-6 h-6 rounded-md bg-surface text-ink-slate flex items-center justify-center font-medium">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[12px] font-semibold text-ink leading-tight">
                {currentUser?.name || "Commander"}
              </p>
              <p className="text-[10px] text-ink-steel capitalize">{currentUser?.role || "commander"}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-stone" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-md bg-canvas border border-hairline shadow-modal py-1.5 z-50 animate-in fade-in-50 duration-100">
              <div className="px-3 py-1.5 border-b border-hairline text-[11px] font-semibold text-ink-stone uppercase tracking-wider">
                Select Active Operational Role
              </div>
              {ROLES_LIST.map((r) => {
                const isActive = currentUser?.role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSwitchRole(r.id)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-surface transition ${
                      isActive ? "text-primary font-semibold bg-tint-lavender/40" : "text-ink-charcoal"
                    }`}
                  >
                    <span>{r.title}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
