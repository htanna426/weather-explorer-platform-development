"use client";

// -----------------------------------------------------------------------------
// Custom React Query hooks — the ONLY place components should reach for
// server data. Keeping query keys, fetchers, and cache invalidation logic
// here (rather than scattered across components) keeps the data layer
// reusable and easy to reason about.
// -----------------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  DashboardStatsResponseDto,
  ListWeatherFilesResponseDto,
  StoreWeatherResponseDto,
  WeatherFileContentResponseDto,
} from "@/types/api";
import type { WeatherFormValues } from "@/lib/schemas";

export const weatherQueryKeys = {
  all: ["weather"] as const,
  files: (params: FilesQueryParams) => ["weather", "files", params] as const,
  fileContent: (filename: string) => ["weather", "file", filename] as const,
  stats: () => ["weather", "stats"] as const,
};

export interface FilesQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export function useWeatherFiles(params: FilesQueryParams) {
  return useQuery({
    queryKey: weatherQueryKeys.files(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ListWeatherFilesResponseDto>("/weather/files", { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: weatherQueryKeys.stats(),
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardStatsResponseDto>("/weather/stats");
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useFileContent(filename: string | null) {
  return useQuery({
    queryKey: weatherQueryKeys.fileContent(filename ?? ""),
    queryFn: async () => {
      const { data } = await apiClient.get<WeatherFileContentResponseDto>(
        `/weather/files/${encodeURIComponent(filename ?? "")}`,
      );
      return data;
    },
    enabled: Boolean(filename),
  });
}

export function useStoreWeatherData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: WeatherFormValues) => {
      const { data } = await apiClient.post<StoreWeatherResponseDto>("/weather/store", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weather"] });
    },
  });
}

export function useDeleteWeatherFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filename: string) => {
      const { data } = await apiClient.delete<{ deleted: boolean }>(`/weather/files/${encodeURIComponent(filename)}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weather"] });
    },
  });
}
