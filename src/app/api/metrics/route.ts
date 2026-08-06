// GET /api/metrics — lightweight runtime metrics (process uptime, memory,
// event loop) exposed in a Prometheus-friendly plain text format alongside a
// JSON variant, useful for quick operational visibility without standing up
// a full observability stack.
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/middleware/api-handler";
import { weatherFileRepository } from "@/repositories/weather-file-repository";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
  const mem = process.memoryUsage();
  const stats = await weatherFileRepository.aggregateStats();
  const wantsPlainText = new URL(req.url).searchParams.get("format") === "prometheus";

  const metrics = {
    process_uptime_seconds: process.uptime(),
    memory_rss_bytes: mem.rss,
    memory_heap_used_bytes: mem.heapUsed,
    memory_heap_total_bytes: mem.heapTotal,
    weather_datasets_total: Number(stats.totalFiles ?? 0),
    weather_storage_bytes_total: Number(stats.totalBytes ?? 0),
    weather_cache_hits_total: Number(stats.totalCacheHits ?? 0),
  };

  if (wantsPlainText) {
    const lines = Object.entries(metrics).map(([key, value]) => `${key} ${value}`);
    return new NextResponse(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; version=0.0.4" } });
  }

  return NextResponse.json(metrics);
}, { rateLimit: false });
