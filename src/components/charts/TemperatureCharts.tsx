"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from "recharts";
import type { DailyAnalyticsRowDto } from "@/types/api";

type SeriesKey = "tempMax" | "tempMin" | "apparentMax" | "apparentMin" | "avgTemp" | "tempRange" | "movingAverage";

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "tempMax", label: "Max Temp", color: "#22d3ee" },
  { key: "tempMin", label: "Min Temp", color: "#6366f1" },
  { key: "apparentMax", label: "Apparent Max", color: "#fbbf24" },
  { key: "apparentMin", label: "Apparent Min", color: "#fb7185" },
  { key: "avgTemp", label: "Average", color: "#34d399" },
  { key: "tempRange", label: "Temp Difference", color: "#a78bfa" },
  { key: "movingAverage", label: "Moving Avg (3d)", color: "#f472b6" },
];

function TooltipCard({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg border border-white/10 p-3 text-xs shadow-xl">
      <p className="mb-1.5 font-medium text-slate-200">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-mono text-slate-100">{entry.value}°C</span>
        </div>
      ))}
    </div>
  );
}

export function TemperatureCharts({ rows }: { rows: DailyAnalyticsRowDto[] }) {
  const [active, setActive] = useState<Set<SeriesKey>>(new Set(["tempMax", "tempMin", "movingAverage"]));

  const data = useMemo(() => rows.map((r) => ({ ...r, date: r.date.slice(5) })), [rows]);

  function toggle(key: SeriesKey) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {SERIES.map((s) => (
          <button
            key={s.key}
            onClick={() => toggle(s.key)}
            className="focus-ring flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-opacity"
            style={{
              borderColor: active.has(s.key) ? s.color : "rgba(255,255,255,0.1)",
              color: active.has(s.key) ? s.color : "#64748b",
              opacity: active.has(s.key) ? 1 : 0.6,
              background: active.has(s.key) ? `${s.color}1a` : "transparent",
            }}
            aria-pressed={active.has(s.key)}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="tempMaxFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="°" />
          <Tooltip content={<TooltipCard />} />
          <Legend wrapperStyle={{ display: "none" }} />
          {active.has("tempMax") && (
            <Area type="monotone" dataKey="tempMax" name="Max Temp" stroke="#22d3ee" fill="url(#tempMaxFill)" strokeWidth={2} />
          )}
          {SERIES.filter((s) => s.key !== "tempMax").map(
            (s) =>
              active.has(s.key) && (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ),
          )}
          <Brush dataKey="date" height={24} stroke="#334155" fill="rgba(255,255,255,0.02)" travellerWidth={8} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
