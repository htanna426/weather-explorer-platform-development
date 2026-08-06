// -----------------------------------------------------------------------------
// Maps internal Drizzle rows to public-facing DTOs. Keeping this mapping in
// one place means the DB schema can evolve independently of the API
// contract exposed to the frontend.
// -----------------------------------------------------------------------------
import type { WeatherDatasetRow } from "@/db/schema";
import type { WeatherDatasetDto } from "@/types/api";

export function toDatasetDto(row: WeatherDatasetRow): WeatherDatasetDto {
  return {
    id: row.id,
    filename: row.filename,
    latitude: row.latitude,
    longitude: row.longitude,
    startDate: row.startDate,
    endDate: row.endDate,
    locationLabel: row.locationLabel,
    storageProvider: row.storageProvider,
    storagePath: row.storagePath,
    bucket: row.bucket,
    fileSizeBytes: row.fileSizeBytes,
    recordCount: row.recordCount,
    status: row.status,
    cacheHits: row.cacheHits,
    avgTemperature: row.avgTemperature,
    maxTemperature: row.maxTemperature,
    minTemperature: row.minTemperature,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
