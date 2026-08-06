// -----------------------------------------------------------------------------
// Storage provider factory.
//
// Centralizes the decision of which concrete `WeatherStorageProvider` to
// instantiate. Consumers should always resolve the provider through this
// module (never `new LocalStorageProvider()` directly) so switching backends
// is a one-line configuration change.
//
// Provider selection priority:
//  1. S3 (if STORAGE_PROVIDER=s3 and AWS credentials are complete)
//  2. Database (if STORAGE_PROVIDER=database or NODE_ENV=production)
//  3. Local (only in development/test environments)
//
// Production environments MUST NOT use local filesystem storage due to
// Vercel Serverless Functions' ephemeral nature (ENOENT errors on .data/).
// -----------------------------------------------------------------------------
import { config, isS3Configured } from "@/core/config";
import { logger } from "@/core/logger";
import { LocalStorageProvider } from "./local-storage-provider";
import { S3StorageProvider } from "./s3-storage-provider";
import { DatabaseStorageProvider } from "./database-storage-provider";
import type { WeatherStorageProvider } from "./storage-provider";

let cachedProvider: WeatherStorageProvider | null = null;

export function getStorageProvider(): WeatherStorageProvider {
  if (cachedProvider) return cachedProvider;

  // Priority 1: S3 storage (when explicitly configured with credentials)
  if (config.storage.provider === "s3" && isS3Configured) {
    logger.info("storage.provider.selected", {
      provider: "s3",
      bucket: config.storage.aws.bucket,
      env: config.env,
    });
    cachedProvider = new S3StorageProvider();
    return cachedProvider;
  }

  // Warn if S3 was requested but credentials are incomplete
  if (config.storage.provider === "s3" && !isS3Configured) {
    logger.warn("storage.provider.s3.misconfigured", {
      reason: "STORAGE_PROVIDER=s3 but AWS credentials are incomplete; evaluating next provider",
    });
  }

  // Priority 2: Database storage (explicit request or production default)
  if (config.storage.provider === "database" || config.env === "production") {
    logger.info("storage.provider.selected", {
      provider: "database",
      env: config.env,
      reason: config.storage.provider === "database" ? "explicit configuration" : "production environment default",
    });
    cachedProvider = new DatabaseStorageProvider();
    return cachedProvider;
  }

  // Priority 3: Local filesystem (development/test only)
  if (config.env === "development" || config.env === "test") {
    logger.info("storage.provider.selected", {
      provider: "local",
      dir: config.storage.localDir,
      env: config.env,
    });
    cachedProvider = new LocalStorageProvider();
    return cachedProvider;
  }

  // Fallback: should never reach here if config validation is correct
  logger.error("storage.provider.fallback.error", {
    provider: config.storage.provider,
    env: config.env,
    error: "No valid storage provider could be selected",
  });
  throw new Error(
    `No valid storage provider for environment "${config.env}" with provider "${config.storage.provider}". ` +
      "Ensure STORAGE_PROVIDER is set to 'database' or 's3' in production.",
  );
}
