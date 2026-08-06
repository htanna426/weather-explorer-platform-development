import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.")
  );
}

function buildPoolConfig(connectionString: string): PoolConfig {
  const config: PoolConfig = {
    connectionString,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 20,
  };

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode") ?? url.searchParams.get("ssl");
    const hostname = url.hostname;

    // Strip sslmode/ssl from the URL so pg-connection-string doesn't warn about
    // future libpq semantics. We translate the mode into an explicit `ssl` option.
    if (sslMode) {
      url.searchParams.delete("sslmode");
      url.searchParams.delete("ssl");
      config.connectionString = url.toString();
    }

    if (sslMode === "disable") {
      config.ssl = false;
    } else if (sslMode === "verify-full" || sslMode === "verify-ca") {
      config.ssl = true;
    } else if (sslMode === "require" || sslMode === "prefer") {
      // Cloud Postgres providers (Neon, Supabase, Render, etc.) commonly use
      // self-signed or rotating certs. Rejecting unauthorized certs breaks the
      // connection for most free-tier managed Postgres, so we relax verification
      // while still encrypting the transport.
      config.ssl = { rejectUnauthorized: false };
    } else if (!isLocalhost(hostname)) {
      // Default to encrypted but permissive SSL for remote hosts when no mode
      // is specified. This matches the behavior of most managed providers.
      config.ssl = { rejectUnauthorized: false };
    }
  } catch {
    // If the connection string can't be parsed as a URL, keep the original
    // string and let pg handle it.
  }

  return config;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ?? new Pool(buildPoolConfig(databaseUrl));

pool.on("error", (err) => {
  console.error("[db] Unexpected PostgreSQL pool error:", err);
});

pool.on("connect", () => {
  // Intentionally quiet; add logging here if you need to trace connections.
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
