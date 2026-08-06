"use client";

import { useState } from "react";
import { FileJson, FileSpreadsheet, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/Button";
import type { DailyAnalyticsRowDto, WeatherAnalyticsSummaryDto, WeatherDatasetDto } from "@/types/api";

interface ExportMenuProps {
  dataset: WeatherDatasetDto;
  rows: DailyAnalyticsRowDto[];
  summary: WeatherAnalyticsSummaryDto;
}

function downloadUrl(filename: string, format: "json" | "csv") {
  return `/api/weather/files/${encodeURIComponent(filename)}/download?format=${format}`;
}

/** Generates a polished, self-contained PDF analytics report client-side. */
function buildPdfReport({ dataset, rows, summary }: ExportMenuProps) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFontSize(18);
  doc.setTextColor(20, 30, 50);
  doc.text("Weather Explorer — Analytics Report", 40, 48);

  doc.setFontSize(10);
  doc.setTextColor(90, 100, 120);
  doc.text(`Dataset: ${dataset.filename}`, 40, 68);
  doc.text(
    `Location: ${dataset.latitude.toFixed(4)}, ${dataset.longitude.toFixed(4)}  •  Range: ${dataset.startDate} to ${dataset.endDate}`,
    40,
    82,
  );
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 96);

  autoTable(doc, {
    startY: 116,
    head: [["Metric", "Value"]],
    body: [
      ["Highest Temperature", `${summary.highestTemperature}°C`],
      ["Lowest Temperature", `${summary.lowestTemperature}°C`],
      ["Average Temperature", `${summary.averageTemperature}°C`],
      ["Median Temperature", `${summary.medianTemperature}°C`],
      ["Standard Deviation", `${summary.standardDeviation}°C`],
      ["Temperature Range", `${summary.temperatureRange}°C`],
      ["Warmest Day", summary.warmestDay ? `${summary.warmestDay.date} (${summary.warmestDay.temperature}°C)` : "—"],
      ["Coldest Day", summary.coldestDay ? `${summary.coldestDay.date} (${summary.coldestDay.temperature}°C)` : "—"],
    ],
    theme: "striped",
    headStyles: { fillColor: [22, 27, 44] },
    styles: { fontSize: 9 },
  });

  const afterSummaryY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  autoTable(doc, {
    startY: afterSummaryY,
    head: [["Date", "Max °C", "Min °C", "App. Max", "App. Min", "Avg °C", "Range", "MA(3d)"]],
    body: rows.map((r) => [r.date, r.tempMax, r.tempMin, r.apparentMax, r.apparentMin, r.avgTemp, r.tempRange, r.movingAverage ?? "—"]),
    theme: "grid",
    headStyles: { fillColor: [22, 27, 44] },
    styles: { fontSize: 8 },
  });

  doc.save(`${dataset.filename.replace(/\.json\.gz$/, "")}-report.pdf`);
}

export function ExportMenu(props: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const { dataset } = props;

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <Download className="h-3.5 w-3.5" /> Export
      </Button>
      {open && (
        <div
          role="menu"
          className="glass-panel absolute right-0 z-20 mt-2 w-52 rounded-xl border border-white/10 p-1.5 shadow-2xl"
          onMouseLeave={() => setOpen(false)}
        >
          <a
            role="menuitem"
            href={downloadUrl(dataset.filename, "json")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            <FileJson className="h-4 w-4 text-cyan-300" /> Raw JSON
          </a>
          <a
            role="menuitem"
            href={downloadUrl(dataset.filename, "csv")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-300" /> CSV (daily rows)
          </a>
          <button
            role="menuitem"
            onClick={() => {
              buildPdfReport(props);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
          >
            <FileText className="h-4 w-4 text-amber-300" /> PDF report
          </button>
        </div>
      )}
    </div>
  );
}
