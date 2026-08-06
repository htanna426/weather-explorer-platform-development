// -----------------------------------------------------------------------------
// Filesystem-backed storage provider.
//
// Used as the default provider so the platform is fully functional without
// any cloud credentials (great for local dev, CI, and this sandbox). The
// on-disk layout intentionally mirrors an S3 bucket/key structure so
// migrating to `S3StorageProvider` later is a drop-in change.
// -----------------------------------------------------------------------------
import { mkdir, readFile, writeFile, unlink, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { config } from "@/core/config";
import { StorageError } from "@/core/errors";
import type { StoredObjectMeta, WeatherStorageProvider } from "./storage-provider";

export class LocalStorageProvider implements WeatherStorageProvider {
  readonly provider = "local" as const;
  private readonly rootDir: string;

  constructor(rootDir: string = config.storage.localDir) {
    // `turbopackIgnore` prevents the bundler from over-eagerly tracing the
    // entire project graph when it sees a dynamic `process.cwd()`-based path.
    this.rootDir = resolve(/* turbopackIgnore: true */ process.cwd(), rootDir);
  }

  private resolveKey(key: string): string {
    const target = resolve(this.rootDir, key);
    if (!target.startsWith(this.rootDir)) {
      throw new StorageError("Resolved storage path escapes the storage root");
    }
    return target;
  }

  async putObject(key: string, body: Buffer): Promise<StoredObjectMeta> {
    try {
      const target = this.resolveKey(key);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, body);
      return {
        path: `local://${key}`,
        bucket: null,
        sizeBytes: body.byteLength,
        provider: "local",
      };
    } catch (error) {
      throw new StorageError("Failed to write object to local storage", { cause: String(error) });
    }
  }

  async getObject(key: string): Promise<Buffer> {
    try {
      return await readFile(this.resolveKey(key));
    } catch (error) {
      throw new StorageError("Failed to read object from local storage", { cause: String(error) });
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await unlink(this.resolveKey(key));
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") {
        throw new StorageError("Failed to delete object from local storage", { cause: String(error) });
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
}

export function buildLocalKey(filename: string): string {
  return join("weather", filename);
}
