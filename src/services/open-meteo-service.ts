// -----------------------------------------------------------------------------
// Open-Meteo integration service.
//
// Responsible ONLY for talking to the upstream archive API: building the
// request, retrying transient failures with exponential backoff + jitter,
// and returning the raw JSON payload untouched (the orchestration layer
// decides what to do with it). This isolation means the retry/backoff policy
// can be unit tested with a mocked `fetch` without touching storage or DB.
// -----------------------------------------------------------------------------
import { config } from "@/core/config";
import { logger } from "@/core/logger";
import { UpstreamServiceError } from "@/core/errors";

export const DAILY_METRICS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
] as const;

export interface OpenMeteoDailyPayload {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily_units: Record<string, string>;
  daily: OpenMeteoDailyPayload;
  [key: string]: unknown;
}

interface FetchParams {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl({ latitude, longitude, startDate, endDate }: FetchParams): string {
  const url = new URL(config.openMeteo.baseUrl);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("daily", DAILY_METRICS.join(","));
  url.searchParams.set("timezone", "auto");
  return url.toString();
}

/**
 * Fetches historical daily weather data from Open-Meteo.
 *
 * Retries on network errors and 5xx / 429 responses using exponential
 * backoff with jitter (base 400ms, doubling each attempt, capped at 4s).
 * 4xx client errors (e.g. invalid coordinates) fail fast without retrying.
 */
export async function fetchHistoricalWeather(params: FetchParams): Promise<{ payload: OpenMeteoResponse; sourceUrl: string }> {
  const url = buildUrl(params);
  const maxRetries = config.openMeteo.maxRetries;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const startedAt = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.openMeteo.timeoutMs);

      const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      clearTimeout(timeout);

      const durationMs = Date.now() - startedAt;

      if (response.ok) {
        const payload = (await response.json()) as OpenMeteoResponse;
        logger.info("open_meteo.fetch.success", { attempt, durationMs, url });
        return { payload, sourceUrl: url };
      }

      const body = await response.text().catch(() => "");

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        logger.warn("open_meteo.fetch.client_error", { attempt, status: response.status, body });
        throw new UpstreamServiceError(`Open-Meteo rejected the request (HTTP ${response.status})`, { body });
      }

      lastError = new UpstreamServiceError(`Open-Meteo returned HTTP ${response.status}`, { body });
      logger.warn("open_meteo.fetch.retryable_error", { attempt, status: response.status, durationMs });
    } catch (error) {
      if (error instanceof UpstreamServiceError && error.statusCode === 502 && attempt === 0 && maxRetries === 0) {
        throw error;
      }
      lastError = error;
      logger.warn("open_meteo.fetch.exception", { attempt, error: String(error) });

      if (error instanceof UpstreamServiceError && error.message.includes("rejected the request")) {
        throw error;
      }
    }

    if (attempt < maxRetries) {
      const backoffMs = Math.min(400 * 2 ** attempt, 4000) + Math.random() * 200;
      await sleep(backoffMs);
    }
  }

  logger.error("open_meteo.fetch.exhausted", { maxRetries, error: String(lastError) });
  throw new UpstreamServiceError("Open-Meteo is currently unavailable after multiple retries", {
    cause: String(lastError),
  });
}
