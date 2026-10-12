"use client";

import React, { useState } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { CopilotDrawer } from "@/components/CopilotDrawer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>ProjectX · Dynamic Air Operations & Resource Optimisation</title>
        <meta name="description" content="AI/ML Decision-Support Platform for Dynamic Air Operations (SIH 2026 Problem Statement 26250)" />
      </head>
      <body className="bg-white text-ink-charcoal min-h-screen flex flex-col font-sans antialiased selection:bg-tint-lavender selection:text-ink-deep">
        {/* Notion Promo Strip */}
        <div className="bg-surface text-ink text-xs font-medium px-4 py-1.5 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-semantic-success animate-pulse"></span>
            <span>ProjectX C2 Command Platform · Powered by OR-Tools CP-SAT & Trained Random Forest ML</span>
          </div>
          <div className="hidden md:flex items-center space-x-3 text-ink-steel text-[11px]">
            <span>SIH-26250 Specification Compliant</span>
            <span>·</span>
            <span>Multi-Sensor Fusion Active</span>
          </div>
        </div>

        <Navbar onOpenCopilot={() => setCopilotOpen(true)} />
        
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-surface-soft p-6 lg:p-8">
            {children}
          </main>
        </div>
        
        <CopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
      </body>
    </html>
  );
}
