"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accent?: "cyan" | "indigo" | "emerald" | "amber";
  index?: number;
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  cyan: "from-cyan-400/20 to-cyan-400/0 text-cyan-300",
  indigo: "from-indigo-400/20 to-indigo-400/0 text-indigo-300",
  emerald: "from-emerald-400/20 to-emerald-400/0 text-emerald-300",
  amber: "from-amber-400/20 to-amber-400/0 text-amber-300",
};

export function StatCard({ label, value, hint, icon, accent = "cyan", index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
      className="glass-card relative overflow-hidden rounded-2xl p-5"
    >
      <div className={clsx("absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl", ACCENT_CLASSES[accent])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <div className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06]", ACCENT_CLASSES[accent].split(" ").pop())}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
