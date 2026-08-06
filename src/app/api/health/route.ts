// GET /api/health — liveness/readiness probe used by the platform runtime and
// container orchestrators (Kubernetes, ECS, etc.). Verifies the database
// connection and reports storage backend status without throwing.
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { config } from "@/core/config";
import { withApiHandler } from "@/middleware/api-handler";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async () => {
    const checks: Record<string, "ok" | "error"> = { database: "error", storage: "ok" };
    let healthy = true;

    try {
      await db.execute(sql`select 1`);
      checks.database = "ok";
    } catch {
      checks.database = "error";
      healthy = false;
    }

    const body = {
      status: healthy ? "healthy" : "unhealthy",
      version: config.version,
      environment: config.env,
      storageProvider: config.storage.provider,
      checks,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(body, { status: healthy ? 200 : 503 });
  },
  { rateLimit: false },
);
