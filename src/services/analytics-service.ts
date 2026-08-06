// -----------------------------------------------------------------------------
// Pure analytics functions over a daily weather payload.
//
// Kept dependency-free and side-effect-free (pure functions) so they can be
// reused verbatim on both the server (precomputing dataset summaries before
// persistence) and re-derived on the client for the analytics panel.
// -----------------------------------------------------------------------------
import type { OpenMeteoDailyPayload } from "./open-meteo-service";

export interface DailyAnalyticsRow {
  date: string;
  tempMax: number;
  tempMin: number;
  apparentMax: number;
  apparentMin: number;
  avgTemp: number;
  tempRange: number;
  movingAverage: number | null;
}

export interface WeatherAnalyticsSummary {
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

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const variance = mean(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

/** Transforms the raw Open-Meteo daily arrays into row-oriented records with a 3-day moving average. */
export function toDailyRows(daily: OpenMeteoDailyPayload, windowSize = 3): DailyAnalyticsRow[] {
  const rows: DailyAnalyticsRow[] = daily.time.map((date, i) => {
    const tempMax = daily.temperature_2m_max[i];
    const tempMin = daily.temperature_2m_min[i];
    const avgTemp = (tempMax + tempMin) / 2;
    return {
      date,
      tempMax,
      tempMin,
      apparentMax: daily.apparent_temperature_max[i],
      apparentMin: daily.apparent_temperature_min[i],
      avgTemp: Number(avgTemp.toFixed(2)),
      tempRange: Number((tempMax - tempMin).toFixed(2)),
      movingAverage: null,
    };
  });

  for (let i = 0; i < rows.length; i += 1) {
    const windowStart = Math.max(0, i - windowSize + 1);
    const windowSlice = rows.slice(windowStart, i + 1).map((r) => r.avgTemp);
    rows[i].movingAverage = Number(mean(windowSlice).toFixed(2));
  }

  return rows;
}

export function summarize(rows: DailyAnalyticsRow[]): WeatherAnalyticsSummary {
  if (rows.length === 0) {
    return {
      highestTemperature: 0,
      lowestTemperature: 0,
      averageTemperature: 0,
      medianTemperature: 0,
      standardDeviation: 0,
      temperatureRange: 0,
      warmestDay: null,
      coldestDay: null,
      dayCount: 0,
    };
  }

  const maxTemps = rows.map((r) => r.tempMax);
  const avgTemps = rows.map((r) => r.avgTemp);

  const warmest = rows.reduce((acc, r) => (r.tempMax > acc.tempMax ? r : acc), rows[0]);
  const coldest = rows.reduce((acc, r) => (r.tempMin < acc.tempMin ? r : acc), rows[0]);

  const highest = Math.max(...maxTemps);
  const lowest = Math.min(...rows.map((r) => r.tempMin));

  return {
    highestTemperature: Number(highest.toFixed(2)),
    lowestTemperature: Number(lowest.toFixed(2)),
    averageTemperature: Number(mean(avgTemps).toFixed(2)),
    medianTemperature: Number(median(avgTemps).toFixed(2)),
    standardDeviation: Number(standardDeviation(avgTemps).toFixed(2)),
    temperatureRange: Number((highest - lowest).toFixed(2)),
    warmestDay: { date: warmest.date, temperature: warmest.tempMax },
    coldestDay: { date: coldest.date, temperature: coldest.tempMin },
    dayCount: rows.length,
  };
}
