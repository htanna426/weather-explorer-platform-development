"use client";

import { CheckCircle2, XCircle, Server, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useHealth, useMetrics, useVersion } from "@/hooks/use-system-queries";
import { formatBytes } from "@/utils/format";

const ENDPOINTS: { method: string; path: string; description: string }[] = [
  { method: "POST", path: "/api/weather/store", description: "Validate, cache-check, fetch from Open-Meteo, compress, upload, persist." },
  { method: "GET", path: "/api/weather/files", description: "Paginated + sortable + searchable dataset listing." },
  { method: "GET", path: "/api/weather/files/{filename}", description: "Full dataset content with computed analytics." },
  { method: "DELETE", path: "/api/weather/files/{filename}", description: "Delete metadata and the underlying stored object." },
  { method: "GET", path: "/api/weather/files/{filename}/download", description: "Download as JSON, CSV, or gzip (?format=)." },
  { method: "GET", path: "/api/weather/stats", description: "Aggregated dashboard metrics." },
  { method: "GET", path: "/api/health", description: "Liveness/readiness probe with DB connectivity check." },
  { method: "GET", path: "/api/metrics", description: "Runtime metrics (JSON or ?format=prometheus)." },
  { method: "GET", path: "/api/version", description: "Build/version metadata." },
];

const METHOD_TONE: Record<string, "cyan" | "emerald" | "amber" | "rose"> = {
  GET: "cyan",
  POST: "emerald",
  DELETE: "rose",
};

export function ApiTab() {
  const { data: health } = useHealth();
  const { data: version } = useVersion();
  const { data: metrics } = useMetrics();

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Server className="h-4 w-4 text-cyan-300" /> System status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Overall</span>
            {health?.status === "healthy" ? (
              <Badge tone="emerald">
                <CheckCircle2 className="h-3 w-3" /> Healthy
              </Badge>
            ) : (
              <Badge tone="rose">
                <XCircle className="h-3 w-3" /> Degraded
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Database</span>
            <span className="text-slate-200">{health?.checks?.database ?? "…"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Storage provider</span>
            <span className="text-slate-200">{version?.storageProvider ?? "…"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Version</span>
            <span className="font-mono text-slate-200">{version?.version ?? "…"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Environment</span>
            <span className="text-slate-200">{version?.environment ?? "…"}</span>
          </div>
          <hr className="border-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Process uptime</span>
            <span className="tabular-nums text-slate-200">{metrics ? `${Math.round(metrics.process_uptime_seconds)}s` : "…"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Heap used</span>
            <span className="tabular-nums text-slate-200">{metrics ? formatBytes(metrics.memory_heap_used_bytes) : "…"}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-cyan-300" /> API reference
          </CardTitle>
          <span className="text-xs text-slate-500">All routes validated with Zod &amp; centrally error-handled</span>
        </CardHeader>
        <CardContent className="space-y-2">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path + ep.method} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <Badge tone={METHOD_TONE[ep.method] ?? "neutral"} className="mt-0.5 shrink-0">
                {ep.method}
              </Badge>
              <div>
                <p className="font-mono text-xs text-slate-200">{ep.path}</p>
                <p className="mt-0.5 text-xs text-slate-500">{ep.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
