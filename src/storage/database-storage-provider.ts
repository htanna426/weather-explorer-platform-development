// -----------------------------------------------------------------------------
// Database-backed storage provider for production/serverless environments.
//
// Stores compressed weather payloads directly in PostgreSQL's BYTEA column
// alongside the metadata. This eliminates filesystem dependencies and works
// seamlessly in Vercel Serverless Functions where ephemeral disk writes fail
// with ENOENT errors.
//
// The provider implements the same `WeatherStorageProvider` contract as local
// and S3 providers, maintaining storage-agnostic service layer code.
// -----------------------------------------------------------------------------
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { weatherDatasets } from "@/db/schema";
import { StorageError } from "@/core/errors";
import { logger } from "@/core/logger";
import type { StoredObjectMeta, WeatherStorageProvider } from "./storage-provider";

/**
 * In-memory staging area for payloads awaiting database insertion.
 * When putObject() is called, the payload is staged here. The repository
 * layer then retrieves and persists it during the metadata INSERT, after
 * which it's removed from the staging area.
 */
const pendingPayloads = new Map<string, Buffer>();

export class DatabaseStorageProvider implements WeatherStorageProvider {
  readonly provider = "database" as const;

  async putObject(key: string, body: Buffer, contentType = "application/gzip"): Promise<StoredObjectMeta> {
    try {
      // Stage the payload for later retrieval by the repository layer
      pendingPayloads.set(key, body);

      logger.debug("storage.database.putObject.staged", { key, sizeBytes: body.byteLength });

      return {
        path: `db://${key}`,
        bucket: null,
        sizeBytes: body.byteLength,
        provider: "database",
      };
    } catch (error) {
      pendingPayloads.delete(key);
      throw new StorageError("Failed to stage object in database storage", { cause: String(error) });
    }
  }

  async getObject(key: string): Promise<Buffer> {
    try {
      // Check staging area first (for objects not yet persisted)
      const staged = pendingPayloads.get(key);
      if (staged) {
        return staged;
      }

      // Retrieve from database
      const [row] = await db
        .select({ payload: weatherDatasets.payload })
        .from(weatherDatasets)
        .where(eq(weatherDatasets.filename, key))
        .limit(1);

      if (!row?.payload) {
        throw new StorageError(`Object not found in database: ${key}`);
      }

      return row.payload;
    } catch (error) {
      throw new StorageError("Failed to retrieve object from database storage", { cause: String(error) });
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      // Remove from staging area if present
      pendingPayloads.delete(key);

      // Clear payload from database (soft delete of blob, metadata remains)
      await db
        .update(weatherDatasets)
        .set({ payload: null })
        .where(eq(weatherDatasets.filename, key));

      logger.debug("storage.database.deleteObject", { key });
    } catch (error) {
      throw new StorageError("Failed to delete object from database storage", { cause: String(error) });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      // Check staging area first
      if (pendingPayloads.has(key)) {
        return true;
      }

      // Check database
      const [row] = await db
        .select({ id: weatherDatasets.id, payload: weatherDatasets.payload })
        .from(weatherDatasets)
        .where(eq(weatherDatasets.filename, key))
        .limit(1);

      return row?.payload !== null;
    } catch {
      return false;
    }
  }
}

/**
 * Retrieve a staged payload for a given key and remove it from staging.
 * Called by the repository layer during INSERT to persist the payload
 * alongside metadata in a single transaction.
 */
export function consumePendingPayload(key: string): Buffer | undefined {
  const payload = pendingPayloads.get(key);
  if (payload) {
    pendingPayloads.delete(key);
  }
  return payload;
}

/**
 * Build a database storage key from a filename.
 * For database storage, the key is simply the filename itself.
 */
export function buildDatabaseKey(filename: string): string {
  return filename;
}
