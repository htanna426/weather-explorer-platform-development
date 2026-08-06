import { defineConfig } from "drizzle-kit";

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  const sslMode = parsed.searchParams.get("sslmode") ?? parsed.searchParams.get("ssl");
  const hostname = parsed.hostname;

  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.");

  let ssl: boolean | "require" | "allow" | "prefer" | "verify-full" | { rejectUnauthorized: boolean } = false;
  if (sslMode === "disable") {
    ssl = false;
  } else if (sslMode === "verify-full" || sslMode === "verify-ca") {
    ssl = "verify-full";
  } else if (sslMode === "require" || sslMode === "prefer") {
    ssl = { rejectUnauthorized: false };
  } else if (!isLocal) {
    ssl = { rejectUnauthorized: false };
  }

  return {
    host: hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    ssl,
  };
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run Drizzle Kit commands");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: parseDatabaseUrl(databaseUrl),
});
