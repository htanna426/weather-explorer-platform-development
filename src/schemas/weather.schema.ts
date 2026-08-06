// -----------------------------------------------------------------------------
// Zod schemas — single source of truth for request/response validation.
//
// These schemas are shared between the API route handlers (server-side
// enforcement) and the frontend form (client-side UX) via `src/lib/schemas`
// re-export, guaranteeing both layers can never drift apart.
// -----------------------------------------------------------------------------
import { z } from "zod";
import { daysBetween, isFutureDate, isValidIsoDate, MAX_RANGE_DAYS } from "@/utils/dates";

export const isoDateSchema = z
  .string()
  .refine(isValidIsoDate, { message: "Date must be a valid calendar date in YYYY-MM-DD format" });

/**
 * Shared cross-field validation (date ordering, future dates, max range).
 * Applied identically to both the server-side (coerced) schema and the
 * client-side (already-numeric) form schema so validation can never drift
 * between the browser and the API.
 */
function applyDateRangeRules<T extends { startDate: string; endDate: string }>(data: T, ctx: z.RefinementCtx) {
  if (isFutureDate(data.startDate)) {
    ctx.addIssue({ code: "custom", path: ["startDate"], message: "Start date cannot be in the future" });
  }
  if (isFutureDate(data.endDate)) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date cannot be in the future" });
  }
  if (data.startDate > data.endDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the start date" });
    return;
  }
  const span = daysBetween(data.startDate, data.endDate);
  if (span > MAX_RANGE_DAYS) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: `Date range cannot exceed ${MAX_RANGE_DAYS} days (requested ${span} days)`,
    });
  }
}

// Kept as a plain optional string (no `.transform`) so the inferred type
// stays a simple `string | undefined` on both the client and server schemas
// — sanitization (stripping `<`/`>`) happens explicitly in the service layer
// via `sanitizeLocationLabel` instead of inside the schema, which keeps the
// Zod input/output types perfectly symmetric for `zodResolver`.
const locationLabelSchema = z.string().trim().max(120, "Location label must be 120 characters or fewer").optional();

export function sanitizeLocationLabel(value: string | undefined | null): string | null {
  if (!value) return null;
  return value.replace(/[<>]/g, "").trim() || null;
}

// Server-side schema: accepts values coming from JSON bodies / query strings,
// which may arrive as strings, hence `z.coerce.number()`.
export const storeWeatherRequestSchema = z
  .object({
    latitude: z
      .coerce.number({ error: "Latitude must be a number" })
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90"),
    longitude: z
      .coerce.number({ error: "Longitude must be a number" })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    locationLabel: locationLabelSchema,
  })
  .superRefine(applyDateRangeRules);

export type StoreWeatherRequest = z.infer<typeof storeWeatherRequestSchema>;

// Client-side (React Hook Form) schema: inputs are already `number` thanks to
// `valueAsNumber: true` on the form fields, so no coercion is needed and the
// inferred input/output types line up cleanly with `zodResolver`.
export const clientWeatherFormSchema = z
  .object({
    latitude: z
      .number({ error: "Latitude must be a number" })
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90"),
    longitude: z
      .number({ error: "Longitude must be a number" })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    locationLabel: locationLabelSchema,
  })
  .superRefine(applyDateRangeRules);

export type ClientWeatherFormValues = z.infer<typeof clientWeatherFormSchema>;

export const listWeatherFilesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional(),
  sortBy: z
    .enum(["createdAt", "filename", "fileSizeBytes", "avgTemperature", "latitude", "longitude"])
    .default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type ListWeatherFilesQuery = z.infer<typeof listWeatherFilesQuerySchema>;

export const filenameParamSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-zA-Z0-9._-]+$/, "Filename contains invalid characters")
  .refine((value) => !value.includes(".."), { message: "Filename cannot contain path traversal sequences" });
