// -----------------------------------------------------------------------------
// Repository layer — the only module allowed to speak Drizzle/SQL directly.
//
// Encapsulating persistence behind a repository keeps services testable
// (they can be given a fake repository in unit tests) and keeps query logic
// out of route handlers, per Clean Architecture's dependency rule.
// -----------------------------------------------------------------------------
import { and, asc, count, desc, eq, gte, ilike, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { weatherDatasets, type NewWeatherDatasetRow, type WeatherDatasetRow } from "@/db/schema";
import { consumePendingPayload } from "@/storage/database-storage-provider";
import type { ListWeatherFilesQuery } from "@/schemas/weather.schema";

const SORT_COLUMN_MAP = {
  createdAt: weatherDatasets.createdAt,
  filename: weatherDatasets.filename,
  fileSizeBytes: weatherDatasets.fileSizeBytes,
  avgTemperature: weatherDatasets.avgTemperature,
  latitude: weatherDatasets.latitude,
  longitude: weatherDatasets.longitude,
} as const;

export class WeatherFileRepository {
  async findByRequestHash(requestHash: string): Promise<WeatherDatasetRow | undefined> {
    const [row] = await db.select().from(weatherDatasets).where(eq(weatherDatasets.requestHash, requestHash)).limit(1);
    return row;
  }

  async findByFilename(filename: string): Promise<WeatherDatasetRow | undefined> {
    const [row] = await db.select().from(weatherDatasets).where(eq(weatherDatasets.filename, filename)).limit(1);
    return row;
  }

  async incrementCacheHit(id: number): Promise<void> {
    await db
      .update(weatherDatasets)
      .set({ cacheHits: sql`${weatherDatasets.cacheHits} + 1`, updatedAt: new Date() })
      .where(eq(weatherDatasets.id, id));
  }

  async create(values: NewWeatherDatasetRow): Promise<WeatherDatasetRow> {
    // Check if there's a pending payload from the database storage provider
    // that should be stored alongside the metadata in the same row.
    const payload = consumePendingPayload(values.filename);
    const valuesWithPayload = payload ? { ...values, payload } : values;

    const [row] = await db.insert(weatherDatasets).values(valuesWithPayload).returning();
    return row;
  }

  async delete(filename: string): Promise<WeatherDatasetRow | undefined> {
    const [row] = await db.delete(weatherDatasets).where(eq(weatherDatasets.filename, filename)).returning();
    return row;
  }

  async list(query: ListWeatherFilesQuery): Promise<{ items: WeatherDatasetRow[]; total: number }> {
    const filters: SQL[] = [];
    if (query.search) {
      filters.push(
        sql`(${ilike(weatherDatasets.filename, `%${query.search}%`)} OR ${ilike(
          weatherDatasets.locationLabel,
          `%${query.search}%`,
        )})`,
      );
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    const sortColumn = SORT_COLUMN_MAP[query.sortBy];
    const orderFn = query.sortDirection === "asc" ? asc : desc;
    const offset = (query.page - 1) * query.pageSize;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(weatherDatasets)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(query.pageSize)
        .offset(offset),
      db.select({ value: count() }).from(weatherDatasets).where(whereClause),
    ]);

    return { items, total: totalResult[0]?.value ?? 0 };
  }

  async aggregateStats() {
    const [row] = await db
      .select({
        totalFiles: count(),
        totalBytes: sql<number>`coalesce(sum(${weatherDatasets.fileSizeBytes}), 0)`,
        uniqueLocations: sql<number>`count(distinct (${weatherDatasets.latitude}, ${weatherDatasets.longitude}))`,
        avgTemperature: sql<number>`avg(${weatherDatasets.avgTemperature})`,
        totalCacheHits: sql<number>`coalesce(sum(${weatherDatasets.cacheHits}), 0)`,
      })
      .from(weatherDatasets);

    const [latest] = await db.select().from(weatherDatasets).orderBy(desc(weatherDatasets.createdAt)).limit(1);

    return { ...row, latest };
  }

  /** Utility used by tests / analytics: filter datasets touching a date range. */
  async findWithinRange(start: string, end: string): Promise<WeatherDatasetRow[]> {
    return db
      .select()
      .from(weatherDatasets)
      .where(and(gte(weatherDatasets.startDate, start), lte(weatherDatasets.endDate, end)));
  }
}

export const weatherFileRepository = new WeatherFileRepository();
