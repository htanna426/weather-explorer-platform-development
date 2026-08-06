// GET /api/weather/stats — aggregated dashboard metrics (spec: `GET /stats`).
import { NextResponse } from "next/server";
import { withApiHandler } from "@/middleware/api-handler";
import { weatherFileRepository } from "@/repositories/weather-file-repository";
import { toDatasetDto } from "@/services/dataset-mapper";
import type { DashboardStatsResponseDto } from "@/types/api";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  const stats = await weatherFileRepository.aggregateStats();

  const responseBody: DashboardStatsResponseDto = {
    totalFiles: Number(stats.totalFiles ?? 0),
    totalBytes: Number(stats.totalBytes ?? 0),
    uniqueLocations: Number(stats.uniqueLocations ?? 0),
    averageTemperature: stats.avgTemperature !== null ? Number(Number(stats.avgTemperature).toFixed(2)) : null,
    totalCacheHits: Number(stats.totalCacheHits ?? 0),
    latest: stats.latest ? toDatasetDto(stats.latest) : null,
  };

  return NextResponse.json(responseBody);
});
