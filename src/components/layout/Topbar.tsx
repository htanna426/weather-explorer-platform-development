"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar, type DashboardTab } from "./Sidebar";

export function Topbar({
  title,
  subtitle,
  activeTab,
  onSelect,
}: {
  title: string;
  subtitle: string;
  activeTab: DashboardTab;
  onSelect: (tab: DashboardTab) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-surface-0/80 px-5 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3">
        <button
          className="focus-ring rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </span>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-slate-950/70" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex h-full">
            <Sidebar
              activeTab={activeTab}
              variant="mobile"
              onSelect={(tab) => {
                onSelect(tab);
                setMobileOpen(false);
              }}
            />
            <button
              className="absolute right-3 top-3 rounded-lg bg-white/10 p-2 text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
