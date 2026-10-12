"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  Shuffle,
  Plane,
  Activity,
  LineChart,
  ScrollText,
  MapPin
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Command Center", icon: LayoutDashboard, badge: "LIVE", badgeColor: "bg-tint-mint text-brand-green" },
  { href: "/plan", label: "ATO Planner", icon: CalendarRange, badge: "CP-SAT", badgeColor: "bg-tint-lavender text-brand-purple-800" },
  { href: "/retask", label: "Disruption Lab", icon: Shuffle, badge: "COA", badgeColor: "bg-tint-peach text-brand-orange-deep" },
  { href: "/analytics", label: "Predictive AI/ML", icon: LineChart, badge: "RF-ML", badgeColor: "bg-tint-sky text-link-blue" },
  { href: "/airspace", label: "Airspace & Bases", icon: MapPin, badge: null, badgeColor: "" },
  { href: "/registers", label: "Asset Registers", icon: Plane, badge: null, badgeColor: "" },
  { href: "/fusion", label: "Sensor Hub (COP)", icon: Activity, badge: "8/8", badgeColor: "bg-tint-yellow text-brand-brown" },
  { href: "/audit", label: "Audit Ledger", icon: ScrollText, badge: "SHA-256", badgeColor: "bg-surface border border-hairline text-ink-steel" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-hairline flex flex-col justify-between select-none">
      <div className="py-5 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-ink-stone tracking-wider uppercase">
          Tactical Workspaces
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                isActive
                  ? "bg-canvas text-ink font-semibold shadow-subtle border border-hairline"
                  : "text-ink-slate hover:text-ink hover:bg-hairline-soft border border-transparent"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-ink-steel"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-hairline bg-surface-soft">
        <div className="flex items-center space-x-2 text-[11px] text-ink-slate">
          <span className="w-2 h-2 rounded-full bg-semantic-success"></span>
          <span className="font-medium text-ink">CP-SAT & RF-ML Online</span>
        </div>
        <p className="text-[11px] text-ink-stone mt-1">SIH 2026 Problem Statement 26250</p>
      </div>
    </aside>
  );
}
