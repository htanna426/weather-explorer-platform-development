// -----------------------------------------------------------------------------
// Weather dataset orchestration service — the core business logic layer.
//
// Coordinates: smart-cache lookup -> Open-Meteo fetch -> gzip compression ->
// checksum -> object storage upload -> metadata persistence. Route handlers
// call into this service exclusively; they never talk to the repository,
// storage provider, or Open-Meteo client directly (Separation of Concerns).
// -----------------------------------------------------------------------------
import { logger } from "@/core/logger";
import { NotFoundError } from "@/core/errors";
import { weatherFileRepository } from "@/repositories/weather-file-repository";
import { getStorageProvider } from "@/storage/storage-factory";
import { buildLocalKey } from "@/storage/local-storage-provider";
import { buildDatabaseKey } from "@/storage/database-storage-provider";
import { fetchHistoricalWeather, type OpenMeteoResponse } from "./open-meteo-service";
import { compressJson, decompressToJson } from "@/utils/compression";
import { buildRequestHash, sha256 } from "@/utils/hash";
import { buildWeatherFilename } from "@/utils/format";
import { summarize, toDailyRows } from "./analytics-service";
import { sanitizeLocationLabel, type StoreWeatherRequest } from "@/schemas/weather.schema";
import type { WeatherDatasetRow } from "@/db/schema";

export interface StoreWeatherResult {
  dataset: WeatherDatasetRow;
  cached: boolean;
}

function objectKeyFor(filename: string, provider: "local" | "s3" | "database"): string {
  if (provider === "local") return buildLocalKey(filename);
  if (provider === "database") return buildDatabaseKey(filename);
  return `weather/${filename}`;
}

export class WeatherDatasetService {
  async storeWeatherData(request: StoreWeatherRequest): Promise<StoreWeatherResult> {
    const requestHash = buildRequestHash(request);

    const existing = await weatherFileRepository.findByRequestHash(requestHash);
    if (existing) {
      await weatherFileRepository.incrementCacheHit(existing.id);
      logger.info("weather.cache.hit", { filename: existing.filename, requestHash });
      return { dataset: existing, cached: true };
    }

    const startedAt = Date.now();
    const { payload, sourceUrl } = await fetchHistoricalWeather(request);
    const apiDurationMs = Date.now() - startedAt;

    const rows = toDailyRows(payload.daily);
    const summary = summarize(rows);

    const filename = buildWeatherFilename(request);
    const provider = getStorageProvider();
    const key = objectKeyFor(filename, provider.provider);

    const compressed = await compressJson(payload);
    const contentHash = sha256(JSON.stringify(payload));

    const uploadStartedAt = Date.now();
    const stored = await provider.putObject(key, compressed, "application/gzip");
    const uploadDurationMs = Date.now() - uploadStartedAt;

    const dataset = await weatherFileRepository.create({
      filename,
      requestHash,
      contentHash,
      latitude: request.latitude,
      longitude: request.longitude,
      startDate: request.startDate,
      endDate: request.endDate,
      locationLabel: sanitizeLocationLabel(request.locationLabel),
      storageProvider: stored.provider,
      storagePath: stored.path,
      bucket: stored.bucket,
      fileSizeBytes: stored.sizeBytes,
      recordCount: rows.length,
      status: "completed",
      sourceUrl,
      avgTemperature: summary.averageTemperature,
      maxTemperature: summary.highestTemperature,
      minTemperature: summary.lowestTemperature,
    });

    logger.info("weather.store.success", {
      filename,
      apiDurationMs,
      uploadDurationMs,
      sizeBytes: stored.sizeBytes,
      provider: stored.provider,
    });

    return { dataset, cached: false };
  }

  async getFileContent(filename: string): Promise<{ dataset: WeatherDatasetRow; payload: OpenMeteoResponse }> {
    const dataset = await weatherFileRepository.findByFilename(filename);
    if (!dataset) throw new NotFoundError(`No dataset found for filename "${filename}"`);

    const provider = getStorageProvider();
    const key = objectKeyFor(filename, dataset.storageProvider as "local" | "s3" | "database");
    const buffer = await provider.getObject(key);
    const payload = await decompressToJson<OpenMeteoResponse>(buffer);

    return { dataset, payload };
  }

  async deleteFile(filename: string): Promise<void> {
    const dataset = await weatherFileRepository.findByFilename(filename);
    if (!dataset) throw new NotFoundError(`No dataset found for filename "${filename}"`);

    const provider = getStorageProvider();
    const key = objectKeyFor(filename, dataset.storageProvider as "local" | "s3" | "database");
    await provider.deleteObject(key);
    await weatherFileRepository.delete(filename);
    logger.info("weather.delete.success", { filename });
  }
}

export const weatherDatasetService = new WeatherDatasetService();
