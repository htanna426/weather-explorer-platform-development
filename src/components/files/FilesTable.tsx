"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import { Search, Eye, Download, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useDeleteWeatherFile, useWeatherFiles } from "@/hooks/use-weather-queries";
import { formatBytes } from "@/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { WeatherDatasetDto } from "@/types/api";

const columnHelper = createColumnHelper<WeatherDatasetDto>();

export function FilesTable({ onView }: { onView: (filename: string) => void }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const sortBy = (sorting[0]?.id ?? "createdAt") as "createdAt" | "filename" | "fileSizeBytes" | "avgTemperature" | "latitude" | "longitude";
  const sortDirection = sorting[0]?.desc === false ? "asc" : "desc";

  const { data, isLoading, isFetching } = useWeatherFiles({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    sortBy,
    sortDirection,
  });
  const deleteMutation = useDeleteWeatherFile();

  const columns = useMemo(
    () => [
      columnHelper.accessor("filename", {
        header: "Dataset",
        cell: (info) => (
          <div>
            <p className="max-w-[220px] truncate font-mono text-xs text-cyan-300" title={info.getValue()}>
              {info.getValue()}
            </p>
            {info.row.original.locationLabel && (
              <p className="text-[11px] text-slate-500">{info.row.original.locationLabel}</p>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("latitude", {
        header: "Coordinates",
        cell: (info) => (
          <span className="tabular-nums text-slate-300">
            {info.getValue().toFixed(2)}, {info.row.original.longitude.toFixed(2)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "range",
        header: "Date range",
        cell: (info) => (
          <span className="text-slate-300">
            {info.row.original.startDate} → {info.row.original.endDate}
          </span>
        ),
      }),
      columnHelper.accessor("avgTemperature", {
        header: "Avg. Temp",
        cell: (info) => <span className="tabular-nums text-slate-200">{info.getValue() != null ? `${info.getValue()}°C` : "—"}</span>,
      }),
      columnHelper.accessor("fileSizeBytes", {
        header: "Size",
        cell: (info) => <span className="tabular-nums text-slate-400">{formatBytes(info.getValue())}</span>,
      }),
      columnHelper.accessor("storageProvider", {
        header: "Storage",
        cell: (info) => <Badge tone={info.getValue() === "s3" ? "cyan" : "neutral"}>{info.getValue()}</Badge>,
      }),
      columnHelper.accessor("cacheHits", {
        header: "Cache hits",
        cell: (info) => <span className="tabular-nums text-slate-400">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const filename = info.row.original.filename;
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onView(filename)}
                aria-label={`View ${filename}`}
                className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-cyan-300"
              >
                <Eye className="h-4 w-4" />
              </button>
              <a
                href={`/api/weather/files/${encodeURIComponent(filename)}/download?format=json`}
                aria-label={`Download ${filename}`}
                className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-emerald-300"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                onClick={() => setPendingDelete(filename)}
                aria-label={`Delete ${filename}`}
                className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      }),
    ],
    [onView],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  function runSearch(value: string) {
    setSearch(value);
    window.clearTimeout((runSearch as unknown as { t?: number }).t);
    (runSearch as unknown as { t?: number }).t = window.setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 350);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search by filename or location…"
            aria-label="Search datasets"
            className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>
        <p className="text-xs text-slate-500">{data?.total ?? 0} dataset(s) stored</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortable = ["filename", "fileSizeBytes", "avgTemperature", "latitude"].includes(header.column.id);
                    return (
                      <th key={header.id} className="whitespace-nowrap px-4 py-3 font-medium">
                        {sortable ? (
                          <button
                            className="focus-ring flex items-center gap-1 hover:text-slate-200"
                            onClick={() => header.column.toggleSorting()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorting[0]?.id === header.column.id ? (
                              sorting[0].desc ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronUp className="h-3 w-3" />
                              )
                            ) : null}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/[0.05]">
                    <td colSpan={columns.length} className="px-4 py-3">
                      <div className="skeleton h-5 w-full rounded" />
                    </td>
                  </tr>
                ))}

              {!isLoading &&
                table.getRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-white/[0.05] hover:bg-white/[0.025]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && (data?.items.length ?? 0) === 0 && (
          <EmptyState
            title="No datasets found"
            description="Try adjusting your search, or fetch a new dataset from the “Fetch Data” tab."
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Page {data?.page ?? 1} of {data?.totalPages ?? 1} {isFetching && "· refreshing…"}
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={(data?.totalPages ?? 1) <= page}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4" role="alertdialog" aria-modal="true">
          <div className="glass-card w-full max-w-sm rounded-2xl p-5">
            <p className="text-sm font-semibold text-white">Delete this dataset?</p>
            <p className="mt-1 text-xs text-slate-400 font-mono break-all">{pendingDelete}</p>
            <p className="mt-2 text-xs text-slate-500">This permanently removes the metadata and the stored object.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={deleteMutation.isPending}
                onClick={async () => {
                  await deleteMutation.mutateAsync(pendingDelete);
                  setPendingDelete(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
