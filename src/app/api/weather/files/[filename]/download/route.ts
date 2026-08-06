// GET /api/weather/files/[filename]/download?format=json|csv|gz
// Streams the dataset back to the client as a downloadable attachment.
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/middleware/api-handler";
import { filenameParamSchema } from "@/schemas/weather.schema";
import { weatherDatasetService } from "@/services/weather-dataset-service";
import { toDailyRows } from "@/services/analytics-service";
import { compressJson } from "@/utils/compression";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ filename: string }> };

function toCsv(rows: ReturnType<typeof toDailyRows>): string {
  const header = ["date", "tempMax", "tempMin", "apparentMax", "apparentMin", "avgTemp", "tempRange", "movingAverage"];
  const lines = rows.map((row) =>
    [row.date, row.tempMax, row.tempMin, row.apparentMax, row.apparentMin, row.avgTemp, row.tempRange, row.movingAverage].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export const GET = withApiHandler(async (req: NextRequest, ctx) => {
  const { filename: rawFilename } = await (ctx as RouteContext).params;
  const filename = filenameParamSchema.parse(rawFilename);
  const format = new URL(req.url).searchParams.get("format") ?? "json";

  const { payload } = await weatherDatasetService.getFileContent(filename);

  if (format === "csv") {
    const rows = toDailyRows(payload.daily);
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename.replace(/\.json\.gz$/, "")}.csv"`,
      },
    });
  }

  if (format === "gz") {
    const compressed = await compressJson(payload);
    return new NextResponse(new Uint8Array(compressed), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replace(/\.json\.gz$/, "")}.json"`,
    },
  });
});

export const OPTIONS = withApiHandler(async () => new NextResponse(null, { status: 204 }), { rateLimit: false });
