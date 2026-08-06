import { createHash } from "node:crypto";

/** SHA-256 hex digest of a buffer or string — used for content-addressable integrity checks. */
export function sha256(input: Buffer | string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Deterministic fingerprint for a weather query. Used by the smart-cache
 * layer to detect duplicate (lat, lon, startDate, endDate) requests without
 * floating point ambiguity (coordinates are rounded to 4 decimal places,
 * i.e. ~11m precision — more than enough for daily aggregate weather data).
 */
export function buildRequestHash(params: { latitude: number; longitude: number; startDate: string; endDate: string }): string {
  const lat = params.latitude.toFixed(4);
  const lon = params.longitude.toFixed(4);
  return sha256(`${lat}:${lon}:${params.startDate}:${params.endDate}`);
}
