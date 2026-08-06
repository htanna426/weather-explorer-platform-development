"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, MapPin, Zap } from "lucide-react";
import { weatherFormSchema, type WeatherFormValues } from "@/lib/schemas";
import { useStoreWeatherData } from "@/hooks/use-weather-queries";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ExampleLocations } from "./ExampleLocations";
import { ApiClientError } from "@/lib/api-client";
import type { DashboardTab } from "@/components/layout/Sidebar";

const MapPicker = dynamic(() => import("./MapPicker").then((mod) => mod.MapPicker), {
  ssr: false,
  loading: () => <div className="skeleton h-72 w-full rounded-xl" />,
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function WeatherForm({ onNavigate }: { onNavigate: (tab: DashboardTab) => void }) {
  const [successFilename, setSuccessFilename] = useState<string | null>(null);
  const [wasCached, setWasCached] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WeatherFormValues>({
    resolver: zodResolver(weatherFormSchema),
    defaultValues: {
      latitude: 20.5937,
      longitude: 78.9629,
      startDate: daysAgoIso(14),
      endDate: daysAgoIso(1),
      locationLabel: "India",
    },
  });

  const mutation = useStoreWeatherData();
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  const onSubmit = handleSubmit(async (values) => {
    setSuccessFilename(null);
    try {
      const result = await mutation.mutateAsync(values);
      setSuccessFilename(result.dataset.filename);
      setWasCached(result.cached);
    } catch {
      // Surfaced via mutation.error below
    }
  });

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Query parameters</CardTitle>
          <span className="text-xs text-slate-500">Max 31-day range · dates must not be in the future</span>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Example locations</p>
              <ExampleLocations
                onSelect={(loc) => {
                  setValue("latitude", loc.latitude, { shouldValidate: true });
                  setValue("longitude", loc.longitude, { shouldValidate: true });
                  setValue("locationLabel", loc.label, { shouldValidate: true });
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="mb-1.5 block text-xs font-medium text-slate-400">
                  Latitude
                </label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600"
                  {...register("latitude", { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.latitude)}
                  aria-describedby={errors.latitude ? "latitude-error" : undefined}
                />
                {errors.latitude && (
                  <p id="latitude-error" className="mt-1 text-xs text-rose-400">
                    {errors.latitude.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="longitude" className="mb-1.5 block text-xs font-medium text-slate-400">
                  Longitude
                </label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600"
                  {...register("longitude", { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.longitude)}
                  aria-describedby={errors.longitude ? "longitude-error" : undefined}
                />
                {errors.longitude && (
                  <p id="longitude-error" className="mt-1 text-xs text-rose-400">
                    {errors.longitude.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="locationLabel" className="mb-1.5 block text-xs font-medium text-slate-400">
                Location label <span className="text-slate-600">(optional)</span>
              </label>
              <input
                id="locationLabel"
                type="text"
                placeholder="e.g. HQ rooftop sensor"
                className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600"
                {...register("locationLabel")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="mb-1.5 block text-xs font-medium text-slate-400">
                  Start date
                </label>
                <input
                  id="startDate"
                  type="date"
                  max={todayIso()}
                  className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
                  {...register("startDate")}
                  aria-invalid={Boolean(errors.startDate)}
                />
                {errors.startDate && <p className="mt-1 text-xs text-rose-400">{errors.startDate.message}</p>}
              </div>
              <div>
                <label htmlFor="endDate" className="mb-1.5 block text-xs font-medium text-slate-400">
                  End date
                </label>
                <input
                  id="endDate"
                  type="date"
                  max={todayIso()}
                  className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
                  {...register("endDate")}
                  aria-invalid={Boolean(errors.endDate)}
                />
                {errors.endDate && <p className="mt-1 text-xs text-rose-400">{errors.endDate.message}</p>}
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting || mutation.isPending}>
              <Zap className="h-4 w-4" />
              Fetch &amp; store weather data
            </Button>

            <AnimatePresence mode="wait">
              {mutation.isError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {mutation.error instanceof ApiClientError ? mutation.error.message : "Something went wrong. Please try again."}
                  </span>
                </motion.div>
              )}

              {successFilename && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300"
                >
                  <span className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {wasCached ? "Served from smart cache — no upstream call made." : "Dataset fetched and stored successfully."}{" "}
                      <span className="block font-mono text-xs text-emerald-400/80">{successFilename}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate("datasets")}
                    className="focus-ring shrink-0 rounded-md border border-emerald-400/30 px-2 py-1 text-xs hover:bg-emerald-400/10"
                  >
                    View
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-cyan-300" /> Click to pick coordinates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MapPicker
            latitude={latitude ?? null}
            longitude={longitude ?? null}
            onPick={(lat, lon) => {
              setValue("latitude", lat, { shouldValidate: true });
              setValue("longitude", lon, { shouldValidate: true });
            }}
          />
          <p className="mt-3 text-xs text-slate-500">
            Selected: <span className="font-mono text-slate-300">{latitude?.toFixed(4)}, {longitude?.toFixed(4)}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
