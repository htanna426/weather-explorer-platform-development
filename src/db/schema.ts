// -----------------------------------------------------------------------------
// Drizzle ORM schema — Weather Explorer Platform
// -----------------------------------------------------------------------------
// Design notes:
//  - We only persist METADATA about a fetched weather dataset here. The raw
//    payload returned by Open-Meteo is compressed (gzip) and pushed to an
//    object storage backend (see `src/storage`). This mirrors how a real
//    climate-data platform separates "hot" queryable metadata (Postgres) from
//    "cold" bulk blobs (S3 / GCS), keeping the database small & fast while the
//    object store scales independently.
//  - `requestHash` is a deterministic fingerprint of
//    (lat, lon, startDate, endDate) used by the smart-cache layer to detect
//    duplicate requests without re-hitting the upstream Open-Meteo API.
//  - `contentHash` is the SHA-256 of the raw JSON payload, stored for
//    integrity verification / dedup auditing.
// -----------------------------------------------------------------------------

import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  timestamp,
  date,
  varchar,
  uniqueIndex,
  index,
  customType,
} from "drizzle-orm/pg-core";

// Custom type for PostgreSQL BYTEA (binary data) column
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const weatherDatasets = pgTable(
  "weather_datasets",
  {
    id: serial("id").primaryKey(),

    // Identity / lookup
    filename: varchar("filename", { length: 255 }).notNull().unique(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),

    // Query parameters
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    locationLabel: text("location_label"),

    // Storage details
    storageProvider: varchar("storage_provider", { length: 32 }).notNull(),
    storagePath: text("storage_path").notNull(),
    bucket: varchar("bucket", { length: 255 }),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    recordCount: integer("record_count").notNull().default(0),
    payload: bytea("payload"),

    // Status / lifecycle
    status: varchar("status", { length: 16 }).notNull().default("completed"),
    cacheHits: integer("cache_hits").notNull().default(0),
    sourceUrl: text("source_url"),

    // Precomputed analytics (denormalized for fast dashboard reads)
    avgTemperature: doublePrecision("avg_temperature"),
    maxTemperature: doublePrecision("max_temperature"),
    minTemperature: doublePrecision("min_temperature"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("weather_datasets_request_hash_idx").on(table.requestHash),
    index("weather_datasets_created_at_idx").on(table.createdAt),
    index("weather_datasets_status_idx").on(table.status),
  ],
);

export type WeatherDatasetRow = typeof weatherDatasets.$inferSelect;
export type NewWeatherDatasetRow = typeof weatherDatasets.$inferInsert;
