// POST /api/weather/store — validates the request, checks the smart cache,
// fetches from Open-Meteo when needed, compresses + uploads the raw payload,
// and persists metadata. Equivalent to the spec's `POST /store-weather-data`.
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/middleware/api-handler";
import { storeWeatherRequestSchema } from "@/schemas/weather.schema";
import { weatherDatasetService } from "@/services/weather-dataset-service";
import { toDatasetDto } from "@/services/dataset-mapper";
import type { StoreWeatherResponseDto } from "@/types/api";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const parsed = storeWeatherRequestSchema.parse(body);

  const { dataset, cached } = await weatherDatasetService.storeWeatherData(parsed);

  const responseBody: StoreWeatherResponseDto = { cached, dataset: toDatasetDto(dataset) };
  return NextResponse.json(responseBody, { status: cached ? 200 : 201 });
});

export const OPTIONS = withApiHandler(async () => new NextResponse(null, { status: 204 }), { rateLimit: false });
