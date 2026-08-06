"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Gauge, Percent, Sigma, ThermometerSun } from "lucide-react";
import type { WeatherAnalyticsSummaryDto } from "@/types/api";

function Metric({ label, value, icon, delay }: { label: string; value: string; icon: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-white tabular-nums">{value}</p>
    </motion.div>
  );
}

export function AnalyticsGrid({ summary }: { summary: WeatherAnalyticsSummaryDto }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric label="Highest Temp" value={`${summary.highestTemperature}°C`} icon={<ArrowUp className="h-3.5 w-3.5" />} delay={0} />
      <Metric label="Lowest Temp" value={`${summary.lowestTemperature}°C`} icon={<ArrowDown className="h-3.5 w-3.5" />} delay={0.04} />
      <Metric label="Average Temp" value={`${summary.averageTemperature}°C`} icon={<ThermometerSun className="h-3.5 w-3.5" />} delay={0.08} />
      <Metric label="Median Temp" value={`${summary.medianTemperature}°C`} icon={<Gauge className="h-3.5 w-3.5" />} delay={0.12} />
      <Metric label="Std. Deviation" value={`${summary.standardDeviation}°C`} icon={<Sigma className="h-3.5 w-3.5" />} delay={0.16} />
      <Metric label="Temp Range" value={`${summary.temperatureRange}°C`} icon={<Percent className="h-3.5 w-3.5" />} delay={0.2} />
      <Metric
        label="Warmest Day"
        value={summary.warmestDay ? `${summary.warmestDay.date}` : "—"}
        icon={<ArrowUp className="h-3.5 w-3.5 text-amber-400" />}
        delay={0.24}
      />
      <Metric
        label="Coldest Day"
        value={summary.coldestDay ? `${summary.coldestDay.date}` : "—"}
        icon={<ArrowDown className="h-3.5 w-3.5 text-cyan-400" />}
        delay={0.28}
      />
    </div>
  );
}
