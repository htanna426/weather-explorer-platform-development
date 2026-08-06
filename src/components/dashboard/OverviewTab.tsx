"use client";

import { motion } from "framer-motion";
import { Database, HardDrive, MapPin, Thermometer, Clock, ArrowUpRight } from "lucide-react";
import { useDashboardStats } from "@/hooks/use-weather-queries";
import { StatCard } from "./StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatBytes } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import type { DashboardTab } from "@/components/layout/Sidebar";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export function OverviewTab({ onNavigate }: { onNavigate: (tab: DashboardTab) => void }) {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          index={0}
          label="Total Files"
          value={isLoading ? "—" : String(data?.totalFiles ?? 0)}
          hint="Weather archives stored"
          icon={<Database className="h-5 w-5" />}
          accent="cyan"
        />
        <StatCard
          index={1}
          label="Storage Used"
          value={isLoading ? "—" : formatBytes(data?.totalBytes ?? 0)}
          hint="Compressed (gzip) JSON"
          icon={<HardDrive className="h-5 w-5" />}
          accent="indigo"
        />
        <StatCard
          index={2}
          label="Unique Locations"
          value={isLoading ? "—" : String(data?.uniqueLocations ?? 0)}
          hint="Distinct coordinates queried"
          icon={<MapPin className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          index={3}
          label="Avg. Temperature"
          value={isLoading || data?.averageTemperature == null ? "—" : `${data.averageTemperature}°C`}
          hint="Across all stored datasets"
          icon={<Thermometer className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          index={4}
          label="Latest Upload"
          value={isLoading || !data?.latest ? "—" : relativeTime(data.latest.createdAt)}
          hint={data?.latest ? data.latest.filename.slice(0, 22) + "…" : "No datasets yet"}
          icon={<Clock className="h-5 w-5" />}
          accent="cyan"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Smart cache efficiency</CardTitle>
            <span className="text-xs text-slate-500">{data?.totalCacheHits ?? 0} cache hits</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">
              Every request is fingerprinted by coordinates and date range before hitting Open-Meteo. Duplicate
              requests are served instantly from object storage metadata, cutting upstream API usage and latency.
            </p>
            <div className="mt-5 flex items-center gap-4">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, ((data?.totalCacheHits ?? 0) / Math.max(1, (data?.totalFiles ?? 0) + (data?.totalCacheHits ?? 0))) * 100)}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                />
              </div>
              <Button size="sm" variant="secondary" onClick={() => onNavigate("fetch")}>
                Fetch new data <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest dataset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data?.latest ? (
              <>
                <p className="truncate font-mono text-xs text-cyan-300">{data.latest.filename}</p>
                <div className="flex justify-between text-slate-400">
                  <span>Coordinates</span>
                  <span className="tabular-nums text-slate-200">
                    {data.latest.latitude.toFixed(2)}, {data.latest.longitude.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Range</span>
                  <span className="text-slate-200">
                    {data.latest.startDate} → {data.latest.endDate}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Size</span>
                  <span className="text-slate-200">{formatBytes(data.latest.fileSizeBytes)}</span>
                </div>
                <Button className="mt-3 w-full" size="sm" onClick={() => onNavigate("datasets")}>
                  View in datasets
                </Button>
              </>
            ) : (
              <p className="text-slate-500">No datasets fetched yet. Head to “Fetch Data” to get started.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
