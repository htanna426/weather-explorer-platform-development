"use client";

import clsx from "clsx";
import { CloudSun, Gauge, Database, Radar, Satellite } from "lucide-react";

export type DashboardTab = "overview" | "fetch" | "datasets" | "api";

const NAV_ITEMS: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { id: "overview", label: "Overview", icon: Gauge, description: "Fleet-wide metrics" },
  { id: "fetch", label: "Fetch Data", icon: Radar, description: "Query Open-Meteo" },
  { id: "datasets", label: "Datasets", icon: Database, description: "Stored archives" },
  { id: "api", label: "API & Health", icon: CloudSun, description: "Docs & status" },
];

export function Sidebar({
  activeTab,
  onSelect,
  variant = "desktop",
}: {
  activeTab: DashboardTab;
  onSelect: (tab: DashboardTab) => void;
  variant?: "desktop" | "mobile";
}) {
  return (
    <aside
      className={clsx(
        "w-64 shrink-0 flex-col border-r border-white/[0.06] bg-surface-1 px-4 py-6",
        variant === "desktop" ? "hidden lg:flex" : "flex",
      )}
    >
      <div className="flex items-center gap-2.5 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 shadow-lg shadow-cyan-500/20">
          <CloudSun className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Weather Explorer</p>
          <p className="text-[11px] text-slate-500">Climate Analytics Platform</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "focus-ring group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                active ? "bg-white/[0.08] text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100",
              )}
            >
              <Icon
                className={clsx("h-4.5 w-4.5 shrink-0", active ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300")}
              />
              <span>
                <span className="block font-medium leading-tight">{item.label}</span>
                <span className="block text-[11px] text-slate-500">{item.description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <a
        href="https://open-meteo.com"
        target="_blank"
        rel="noreferrer"
        className="focus-ring flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
      >
        <Satellite className="h-3.5 w-3.5" />
        Data source: Open-Meteo
      </a>
    </aside>
  );
}
