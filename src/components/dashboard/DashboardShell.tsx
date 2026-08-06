"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, type DashboardTab } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { OverviewTab } from "./OverviewTab";
import { WeatherForm } from "@/components/weather-form/WeatherForm";
import { DatasetsTab } from "./DatasetsTab";
import { ApiTab } from "./ApiTab";

const TAB_META: Record<DashboardTab, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Fleet-wide climate data metrics" },
  fetch: { title: "Fetch Data", subtitle: "Query Open-Meteo and archive the results" },
  datasets: { title: "Datasets", subtitle: "Browse, inspect, and export stored archives" },
  api: { title: "API & Health", subtitle: "Service status and API reference" },
};

export function DashboardShell() {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const meta = TAB_META[tab];

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={tab} onSelect={setTab} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={meta.title} subtitle={meta.subtitle} activeTab={tab} onSelect={setTab} />
        <main className="flex-1 px-5 py-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {tab === "overview" && <OverviewTab onNavigate={setTab} />}
              {tab === "fetch" && <WeatherForm onNavigate={setTab} />}
              {tab === "datasets" && <DatasetsTab />}
              {tab === "api" && <ApiTab />}
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="border-t border-white/[0.06] px-5 py-4 text-center text-[11px] text-slate-600 lg:px-8">
          Weather Explorer Platform · Built with Next.js, Drizzle ORM &amp; PostgreSQL · Data courtesy of Open-Meteo
        </footer>
      </div>
    </div>
  );
}
