// -----------------------------------------------------------------------------
// Shared API contract types — consumed by both the route handlers (server)
// and the frontend API client / React Query hooks, guaranteeing the UI can
// never silently drift from what the backend actually returns.
// -----------------------------------------------------------------------------

export interface WeatherDatasetDto {
  id: number;
  filename: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  locationLabel: string | null;
  storageProvider: string;
  storagePath: string;
  bucket: string | null;
  fileSizeBytes: number;
  recordCount: number;
  status: string;
  cacheHits: number;
  avgTemperature: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreWeatherResponseDto {
  cached: boolean;
  dataset: WeatherDatasetDto;
}

export interface ListWeatherFilesResponseDto {
  items: WeatherDatasetDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DailyAnalyticsRowDto {
  date: string;
  tempMax: number;
  tempMin: number;
  apparentMax: number;
  apparentMin: number;
  avgTemp: number;
  tempRange: number;
  movingAverage: number | null;
}

export interface WeatherAnalyticsSummaryDto {
  highestTemperature: number;
  lowestTemperature: number;
  averageTemperature: number;
  medianTemperature: number;
  standardDeviation: number;
  temperatureRange: number;
  warmestDay: { date: string; temperature: number } | null;
  coldestDay: { date: string; temperature: number } | null;
  dayCount: number;
}

export interface WeatherFileContentResponseDto {
  dataset: WeatherDatasetDto;
  analytics: {
    rows: DailyAnalyticsRowDto[];
    summary: WeatherAnalyticsSummaryDto;
  };
  raw: unknown;
}

export interface DashboardStatsResponseDto {
  totalFiles: number;
  totalBytes: number;
  uniqueLocations: number;
  averageTemperature: number | null;
  totalCacheHits: number;
  latest: WeatherDatasetDto | null;
}

export interface ApiErrorBody {
  error: { message: string; code: string; details: unknown };
  requestId: string;
}
