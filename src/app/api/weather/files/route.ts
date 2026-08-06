// GET /api/weather/files — paginated, sortable, searchable dataset listing.
// Equivalent to the spec's `GET /list-weather-files`.
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/middleware/api-handler";
import { listWeatherFilesQuerySchema } from "@/schemas/weather.schema";
import { weatherFileRepository } from "@/repositories/weather-file-repository";
import { toDatasetDto } from "@/services/dataset-mapper";
import type { ListWeatherFilesResponseDto } from "@/types/api";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const query = listWeatherFilesQuerySchema.parse(Object.fromEntries(url.searchParams));

  const { items, total } = await weatherFileRepository.list(query);

  const responseBody: ListWeatherFilesResponseDto = {
    items: items.map(toDatasetDto),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };

  return NextResponse.json(responseBody);
});

export const OPTIONS = withApiHandler(async () => new NextResponse(null, { status: 204 }), { rateLimit: false });
