/** Formats a byte count into a human readable string (KB, MB, GB…). */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
}

/** Builds the canonical, collision-resistant object storage filename. */
export function buildWeatherFilename(params: { latitude: number; longitude: number; startDate: string; endDate: string }): string {
  const lat = params.latitude.toFixed(4);
  const lon = params.longitude.toFixed(4);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `weather_${lat}_${lon}_${params.startDate}_${params.endDate}_${timestamp}.json.gz`;
}
