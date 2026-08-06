// GET    /api/weather/files/[filename] — full dataset content + analytics.
//        Equivalent to the spec's `GET /weather-file-content/{filename}`.
// DELETE /api/weather/files/[filename] — removes metadata + underlying object.
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/middleware/api-handler";
import { filenameParamSchema } from "@/schemas/weather.schema";
import { weatherDatasetService } from "@/services/weather-dataset-service";
import { toDatasetDto } from "@/services/dataset-mapper";
import { summarize, toDailyRows } from "@/services/analytics-service";
import type { WeatherFileContentResponseDto } from "@/types/api";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ filename: string }> };

export const GET = withApiHandler(async (_req: NextRequest, ctx) => {
  const { filename: rawFilename } = await (ctx as RouteContext).params;
  const filename = filenameParamSchema.parse(rawFilename);

  const { dataset, payload } = await weatherDatasetService.getFileContent(filename);
  const rows = toDailyRows(payload.daily);
  const summary = summarize(rows);

  const responseBody: WeatherFileContentResponseDto = {
    dataset: toDatasetDto(dataset),
    analytics: { rows, summary },
    raw: payload,
  };

  return NextResponse.json(responseBody);
});

export const DELETE = withApiHandler(async (_req: NextRequest, ctx) => {
  const { filename: rawFilename } = await (ctx as RouteContext).params;
  const filename = filenameParamSchema.parse(rawFilename);

  await weatherDatasetService.deleteFile(filename);
  return NextResponse.json({ deleted: true, filename });
});

export const OPTIONS = withApiHandler(async () => new NextResponse(null, { status: 204 }), { rateLimit: false });
