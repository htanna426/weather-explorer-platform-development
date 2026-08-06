"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  storageProvider: string;
  checks: Record<string, string>;
  timestamp: string;
}

interface VersionResponse {
  version: string;
  environment: string;
  storageProvider: string;
  apiName: string;
}

interface MetricsResponse {
  process_uptime_seconds: number;
  memory_rss_bytes: number;
  memory_heap_used_bytes: number;
  weather_datasets_total: number;
  weather_storage_bytes_total: number;
  weather_cache_hits_total: number;
}

export function useHealth() {
  return useQuery({
    queryKey: ["system", "health"],
    queryFn: async () => (await apiClient.get<HealthResponse>("/health")).data,
    refetchInterval: 30_000,
  });
}

export function useVersion() {
  return useQuery({
    queryKey: ["system", "version"],
    queryFn: async () => (await apiClient.get<VersionResponse>("/version")).data,
  });
}

export function useMetrics() {
  return useQuery({
    queryKey: ["system", "metrics"],
    queryFn: async () => (await apiClient.get<MetricsResponse>("/metrics")).data,
    refetchInterval: 15_000,
  });
}
