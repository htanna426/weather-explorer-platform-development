// -----------------------------------------------------------------------------
// Centralized, type-safe application configuration.
//
// Every environment variable the app depends on is parsed & validated here
// exactly once at module load time (fail-fast principle). Nothing else in the
// codebase should read `process.env` directly — this keeps configuration
// concerns in a single, testable location (Single Responsibility Principle).
// -----------------------------------------------------------------------------
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Object storage — defaults to a local, filesystem-backed provider so the
  // app runs out of the box in sandboxes/dev without cloud credentials, but
  // transparently switches to AWS S3 or database storage in production when
  // credentials are present. This Strategy-pattern swap is implemented in
  // `src/storage`.
  STORAGE_PROVIDER: z.enum(["local", "s3", "database"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default(".data/weather-objects"),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Open-Meteo upstream
  OPEN_METEO_BASE_URL: z.string().default("https://archive-api.open-meteo.com/v1/archive"),
  OPEN_METEO_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  OPEN_METEO_MAX_RETRIES: z.coerce.number().int().min(0).default(3),

  // Rate limiting (token bucket, per-IP, in-memory — see src/core/rate-limit.ts)
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  APP_VERSION: z.string().default("1.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration. See logs above.");
}

export const env = parsed.data;

// Production safety check: prevent accidental use of local filesystem storage
// in serverless/production environments where ephemeral disk writes fail.
if (env.NODE_ENV === "production" && env.STORAGE_PROVIDER === "local") {
  console.error(
    "❌ STORAGE_PROVIDER=local is not allowed in production. " +
      "Use STORAGE_PROVIDER=database or STORAGE_PROVIDER=s3 instead. " +
      "Local filesystem storage is incompatible with Vercel Serverless Functions.",
  );
  throw new Error("Invalid storage configuration for production environment. See logs above.");
}

export const config = {
  env: env.NODE_ENV,
  version: env.APP_VERSION,
  database: {
    url: env.DATABASE_URL,
  },
  storage: {
    provider: env.STORAGE_PROVIDER,
    localDir: env.STORAGE_LOCAL_DIR,
    aws: {
      region: env.AWS_REGION,
      bucket: env.AWS_S3_BUCKET,
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  },
  openMeteo: {
    baseUrl: env.OPEN_METEO_BASE_URL,
    timeoutMs: env.OPEN_METEO_TIMEOUT_MS,
    maxRetries: env.OPEN_METEO_MAX_RETRIES,
  },
  rateLimit: {
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  },
} as const;

/** True when a fully configured AWS S3 bucket is available. */
export const isS3Configured = Boolean(
  config.storage.aws.bucket && config.storage.aws.region && config.storage.aws.accessKeyId && config.storage.aws.secretAccessKey,
);
