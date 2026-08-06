// GET /api/version — build/version metadata for release tracking.
import { NextResponse } from "next/server";
import { withApiHandler } from "@/middleware/api-handler";
import { config } from "@/core/config";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async () =>
    NextResponse.json({
      version: config.version,
      environment: config.env,
      storageProvider: config.storage.provider,
      apiName: "Weather Explorer Platform API",
    }),
  { rateLimit: false },
);
