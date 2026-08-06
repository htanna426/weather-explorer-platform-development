// Re-exports the client-safe Zod validation schema for the weather form so
// the browser performs the exact same cross-field rules (max range, no
// future dates, ordering) as the API, eliminating "works on client, rejected
// by server" surprises. See `src/schemas/weather.schema.ts` for details on
// why the client uses a non-coercing variant of the server schema.
export { clientWeatherFormSchema as weatherFormSchema } from "@/schemas/weather.schema";
export type { ClientWeatherFormValues as WeatherFormValues } from "@/schemas/weather.schema";
