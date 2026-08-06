"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useFileContent } from "@/hooks/use-weather-queries";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { TemperatureCharts } from "@/components/charts/TemperatureCharts";
import { JsonViewer } from "./JsonViewer";
import { ExportMenu } from "@/components/export/ExportMenu";
import { formatBytes } from "@/utils/format";

type Tab = "overview" | "charts" | "raw";

export function FileViewerDrawer({ filename, onClose }: { filename: string | null; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const { data, isLoading, isError } = useFileContent(filename);

  return (
    <Modal open={Boolean(filename)} onClose={onClose} title={filename ?? ""} widthClassName="max-w-4xl">
      {isLoading && (
        <div className="space-y-3 p-6">
          <div className="skeleton h-24 w-full rounded-xl" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      )}

      {isError && <p className="p-6 text-sm text-rose-300">Failed to load dataset content.</p>}

      {data && (
        <div className="flex h-full flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={data.dataset.storageProvider === "s3" ? "cyan" : "neutral"}>{data.dataset.storageProvider}</Badge>
              <Badge tone="emerald">{data.dataset.status}</Badge>
              <span className="text-xs text-slate-500">{formatBytes(data.dataset.fileSizeBytes)}</span>
              <span className="text-xs text-slate-500">{data.dataset.recordCount} days</span>
            </div>
            <ExportMenu dataset={data.dataset} rows={data.analytics.rows} summary={data.analytics.summary} />
          </div>

          <div className="flex gap-1 border-b border-white/10 px-6 pt-3">
            {(["overview", "charts", "raw"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`focus-ring rounded-t-lg px-3 py-2 text-sm capitalize transition-colors ${
                  tab === t ? "border-b-2 border-cyan-400 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t === "raw" ? "Raw JSON" : t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <MetaItem label="Coordinates" value={`${data.dataset.latitude}, ${data.dataset.longitude}`} />
                  <MetaItem label="Date range" value={`${data.dataset.startDate} → ${data.dataset.endDate}`} />
                  <MetaItem label="Storage path" value={data.dataset.storagePath} mono />
                  <MetaItem label="Cache hits" value={String(data.dataset.cacheHits)} />
                </div>
                <AnalyticsGrid summary={data.analytics.summary} />
              </div>
            )}

            {tab === "charts" && <TemperatureCharts rows={data.analytics.rows} />}

            {tab === "raw" && <JsonViewer data={data.raw} />}
          </div>
        </div>
      )}
    </Modal>
  );
}

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-slate-200 ${mono ? "font-mono text-xs" : "text-sm"}`} title={value}>
        {value}
      </p>
    </div>
  );
}
