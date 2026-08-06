# Weather Explorer — Climate Analytics Platform

A production-grade, full-stack weather analytics platform built with **Next.js 16** and **PostgreSQL**. Fetches historical daily weather from the [Open-Meteo](https://open-meteo.com/) archive API, compresses and archives raw JSON payloads behind a pluggable storage abstraction, and surfaces the data through a rich dashboard with charts, analytics, export, and an interactive map.

## Live Demo & Repo

- **Live demo:** _add your deployed URL here_
- **GitHub repo:** [htanna426/weather-explorer-platform-development](https://github.com/htanna426/weather-explorer-platform-development)
- **Last verified live:** _add the date you last checked the deployed URL_
- **Redeploy on demand:** push to `main` on Vercel (auto-deploys), or run `vercel --prod` from the project root.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (App Router, Route Handlers) |
| **Language** | TypeScript 5.9 (frontend + backend + DB schema) |
| **Database** | PostgreSQL via Drizzle ORM 0.45 |
| **Object storage** | Strategy-pattern abstraction — Local filesystem (dev), PostgreSQL BYTEA (default prod), AWS S3 (optional) |
| **Weather data** | Open-Meteo Historical Weather Archive API (no key required) |
| **Frontend** | React 19 + Tailwind CSS 4 + Recharts + Framer Motion |
| **Forms** | React Hook Form + Zod validation |
| **Data fetching** | TanStack React Query v5 |
| **Map** | Leaflet + React-Leaflet (click-to-pick coordinates) |
| **Export** | jsPDF + jsPDF-AutoTable (PDF), CSV, JSON, gzip |
| **Icons** | Lucide React |

## Architecture

```
src/
  app/
    page.tsx                                    # Dashboard shell entry point
    layout.tsx                                  # Root layout (Inter + JetBrains Mono fonts, query provider)
    api/
      weather/
        store/route.ts                          # POST — validate, smart-cache check, fetch, compress, persist
        files/route.ts                          # GET  — paginated, sortable, searchable dataset listing
        files/[filename]/route.ts               # GET/DELETE — full content + analytics / remove dataset
        files/[filename]/download/route.ts      # GET  — export as JSON, CSV, or gzip attachment
        stats/route.ts                          # GET  — aggregated dashboard metrics
      health/route.ts                           # GET  — liveness/readiness probe (DB + storage check)
      metrics/route.ts                          # GET  — Prometheus-compatible runtime metrics
      version/route.ts                          # GET  — build/version metadata

  components/
    dashboard/
      DashboardShell.tsx                        # Tab-based layout (Overview, Fetch, Datasets, API)
      OverviewTab.tsx                           # Fleet-wide stats cards + recent datasets
      DatasetsTab.tsx                           # Browse, search, sort stored archives
      ApiTab.tsx                                # API reference + health status
      StatCard.tsx                              # Reusable metric card
    weather-form/
      WeatherForm.tsx                           # Coordinate/date input with validation
      MapPicker.tsx                             # Leaflet map for click-to-pick coordinates
      ExampleLocations.tsx                      # Pre-configured location shortcuts
    charts/
      TemperatureCharts.tsx                     # Recharts line/area charts
    analytics/
      AnalyticsGrid.tsx                         # Daily analytics table with summary stats
    files/
      FilesTable.tsx                            # Paginated dataset table
      FileViewerDrawer.tsx                      # Slide-out detail viewer
      JsonViewer.tsx                            # Raw JSON inspector
    export/
      ExportMenu.tsx                            # Multi-format export (JSON/CSV/PDF/gzip)
    layout/
      Sidebar.tsx                               # Navigation sidebar
      Topbar.tsx                                # Top bar with breadcrumbs
    ui/                                           # Shared primitives (Button, Card, Badge, Modal, EmptyState)

  core/
    config.ts                                   # Centralized, Zod-validated env configuration (fail-fast)
    errors.ts                                   # Structured error hierarchy (AppError, NotFoundError, etc.)
    logger.ts                                   # Structured request logging
    rate-limit.ts                               # Per-IP in-memory rate limiter

  services/
    weather-dataset-service.ts                # Orchestration: smart-cache → fetch → compress → store
    open-meteo-service.ts                       # Upstream API client with retry + exponential backoff
    analytics-service.ts                        # Pure analytics (daily rows, moving averages, summaries)
    dataset-mapper.ts                           # DB row → DTO mapping

  repositories/
    weather-file-repository.ts                  # Drizzle-powered CRUD + aggregation queries

  storage/
    storage-provider.ts                         # WeatherStorageProvider interface (Strategy pattern)
    storage-factory.ts                          # Provider selection factory (S3 → Database → Local)
    local-storage-provider.ts                   # Local filesystem (dev/test only)
    database-storage-provider.ts                # PostgreSQL BYTEA storage (production default)
    s3-storage-provider.ts                      # AWS S3 via @aws-sdk/client-s3

  schemas/
    weather.schema.ts                           # Zod schemas (shared server + client validation)

  hooks/
    use-weather-queries.ts                      # React Query hooks for weather API
    use-system-queries.ts                       # React Query hooks for health/metrics/version

  lib/
    api-client.ts                               # Typed Axios client with error handling
    query-provider.tsx                          # TanStack Query provider
    schemas.ts                                  # Client-side form schema re-exports

  types/
    api.ts                                      # Shared API contract types (DTOs)

  utils/
    compression.ts                              # gzip compress/decompress helpers
    dates.ts                                    # Date validation and range utilities
    format.ts                                   # Filename generation, byte formatting
    hash.ts                                     # SHA-256 + request hash for smart caching

  db/
    schema.ts                                   # Drizzle schema — weather_datasets table
    index.ts                                    # Drizzle/pg client
```

## Design Approach

### Overall Philosophy

The platform is built around three guiding principles: **separation of concerns**, **fail-fast validation**, and **backend-agnostic storage**. Every layer of the application has a single, well-defined responsibility, and cross-cutting concerns (logging, rate limiting, error handling) are composed via middleware rather than duplicated across handlers.

### Architectural Layers

The application follows a layered architecture where each layer depends only on the one below it:

```
┌─────────────────────────────────────────────────────┐
│  Components (React UI)                              │
│  DashboardShell, WeatherForm, Charts, ExportMenu    │
├─────────────────────────────────────────────────────┤
│  Hooks (TanStack Query)                             │
│  use-weather-queries, use-system-queries            │
├─────────────────────────────────────────────────────┤
│  API Client (Axios)                                 │
│  Typed HTTP client with error normalization         │
├─────────────────────────────────────────────────────┤
│  Route Handlers (Next.js App Router)                │
│  Thin orchestrators wrapped with withApiHandler     │
├─────────────────────────────────────────────────────┤
│  Middleware (Cross-cutting)                         │
│  Logging, rate limiting, CORS, error handling       │
├─────────────────────────────────────────────────────┤
│  Services (Business Logic)                          │
│  WeatherDatasetService, OpenMeteoService, Analytics │
├─────────────────────────────────────────────────────┤
│  Repositories (Data Access)                         │
│  Drizzle-powered CRUD + aggregation queries         │
├─────────────────────────────────────────────────────┤
│  Storage Providers (Strategy Pattern)               │
│  Local FS │ PostgreSQL BYTEA │ AWS S3               │
└─────────────────────────────────────────────────────┘
```

Route handlers are deliberately thin — they validate input, delegate to a service, and return a response. All business logic lives in the service layer, making it testable in isolation without HTTP overhead.

### Design Patterns in Practice

| Pattern | Where | Why |
|---|---|---|
| **Strategy** | `storage/` — `WeatherStorageProvider` interface with three concrete implementations | Swap storage backends (local, database, S3) via environment variables with zero code changes |
| **Factory** | `storage-factory.ts` — provider selection with priority chain (S3 → Database → Local) | Centralizes the instantiation decision; caches the result for the process lifetime |
| **Repository** | `repositories/weather-file-repository.ts` — all Drizzle queries encapsulated here | Services depend on a clean data-access API, not raw SQL or ORM internals |
| **DTO / Mapper** | `types/api.ts` + `services/dataset-mapper.ts` — internal rows never leak to the API | The database schema can evolve independently of the public API contract |
| **Middleware Composition** | `middleware/api-handler.ts` — `withApiHandler()` wraps every route | Logging, rate limiting, CORS, and error mapping are applied uniformly without repetition |
| **Smart Cache** | `weather-dataset-service.ts` — deterministic request hash (SHA-256 of lat/lon/dates) | Identical requests are served instantly from the database, avoiding redundant upstream API calls |

### Data Flow: Storing Weather Data

The end-to-end flow for a `POST /api/weather/store` request illustrates how the layers interact:

```
Client Request
    │
    ▼
withApiHandler middleware ──► Rate limit check, request ID, logging
    │
    ▼
Route handler ──► Zod schema validation (shared with client)
    │
    ▼
WeatherDatasetService.storeWeatherData()
    │
    ├─► Compute requestHash (SHA-256 of lat, lon, startDate, endDate)
    │
    ├─► Repository: findByRequestHash() ──► Cache hit?
    │       │                                  │
    │       │  YES ◄───────────────────────────┘
    │       │  Increment cacheHits, return cached dataset (200)
    │       │
    │       │  NO
    │       ▼
    ├─► OpenMeteoService.fetchHistoricalWeather()
    │       │  Build URL → fetch with timeout → retry with
    │       │  exponential backoff + jitter on 5xx/429
    │       │  Fail fast on 4xx client errors
    │       ▼
    ├─► Analytics: compute daily rows + summary statistics
    │
    ├─► Compress payload (gzip) + compute contentHash (SHA-256)
    │
    ├─► StorageProvider.putObject() ──► Upload to active backend
    │
    └─► Repository.create() ──► Persist metadata + denormalized analytics
            │
            ▼
    Return new dataset (201)
```

### Frontend Architecture

The frontend is a single-page dashboard built with React 19 and organized into four tabs (Overview, Fetch Data, Datasets, API & Health). Key frontend decisions:

- **TanStack React Query** manages all server state — caching, background refetching, and optimistic updates. Components never call `fetch` directly; they consume typed hooks (`useStoreWeather`, `useWeatherFiles`, `useDashboardStats`).
- **Shared validation schemas** (Zod) are used on both the client (via `react-hook-form` + `zodResolver`) and the server (via `schema.parse()`), so validation rules can never drift between layers.
- **Recharts** renders temperature line/area charts, and **Framer Motion** provides subtle enter/exit animations on cards and drawers.
- **Leaflet + React-Leaflet** powers the interactive map picker, letting users click to select coordinates instead of typing them manually.

### Error Handling Strategy

Errors are classified into three categories, each mapped to an appropriate HTTP status code:

| Category | Class | HTTP Status | Example |
|---|---|---|---|
| Validation errors | `ZodError` | `422` | Invalid coordinates, future dates, range > 31 days |
| Application errors | `AppError` / `NotFoundError` / `UpstreamServiceError` | `404`, `502`, etc. | Dataset not found, Open-Meteo unavailable |
| Unexpected errors | Any unhandled `Error` | `500` | Bugs, infrastructure failures |

Every error response includes a machine-readable `code`, a human-readable `message`, optional `details`, and an `X-Request-Id` header for tracing.

### Configuration & Fail-Fast Validation

All environment variables are parsed and validated **once at module load time** using a Zod schema in `src/core/config.ts`. This means:

- Missing `DATABASE_URL` crashes the process immediately with a clear error — not 30 minutes later when the first query runs.
- `STORAGE_PROVIDER=local` is rejected in production, preventing silent failures on Vercel's ephemeral filesystem.
- Numeric values (`OPEN_METEO_TIMEOUT_MS`, `RATE_LIMIT_MAX_REQUESTS`) are coerced and range-checked.
- Nothing else in the codebase reads `process.env` directly — all configuration flows through the typed `config` object.

### Key Design Decisions

- **Separation of metadata and blobs.** The `weather_datasets` PostgreSQL table stores queryable metadata (coordinates, dates, precomputed analytics) while the raw JSON payload is gzip-compressed and pushed to an object storage backend. This mirrors how a real climate-data platform separates "hot" queryable metadata from "cold" bulk blobs.

- **Strategy-pattern storage abstraction.** Routes and services depend only on the `WeatherStorageProvider` interface. The factory selects the concrete provider (S3 → Database → Local) based on environment variables — no application code changes required when switching backends. Production environments are blocked from using local filesystem storage (incompatible with Vercel Serverless).

- **Smart request caching.** A deterministic `requestHash` (SHA-256 of lat, lon, startDate, endDate) is computed before every fetch. If an identical request already exists, the cached dataset is returned immediately — no upstream API call, no duplicate storage. Cache hits are tracked per-dataset.

- **Centralized, fail-fast configuration.** All environment variables are parsed and validated once at module load time via Zod (`src/core/config.ts`). Missing required vars or invalid production configs throw immediately, preventing silent misconfigurations.

- **Structured error hierarchy.** Custom error classes (`AppError`, `NotFoundError`, `UpstreamServiceError`, etc.) map to correct HTTP status codes. The `withApiHandler` middleware catches all errors and produces consistent, machine-readable responses with `X-Request-Id` correlation.

- **Shared Zod validation.** The same validation rules (coordinate ranges, date ordering, max 31-day range, future date rejection) are enforced identically on both server (coerced from JSON) and client (React Hook Form via `zodResolver`), so the two layers can never drift apart.

- **Retry with exponential backoff.** The Open-Meteo client retries transient failures (network errors, 5xx, 429) with exponential backoff + jitter (base 400ms, doubling, capped at 4s). Client errors (4xx except 429) fail fast without retrying.

- **Precomputed analytics.** Temperature statistics (average, max, min, median, standard deviation, warmest/coldest day) are computed at ingest time and stored as denormalized columns for fast dashboard reads.

## API Reference

### `POST /api/weather/store`

Fetch, compress, and archive weather data. Returns cached result if an identical request already exists.

**Request body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.006,
  "startDate": "2024-06-01",
  "endDate": "2024-06-05",
  "locationLabel": "New York City"
}
```

**Validation:** `latitude ∈ [-90, 90]`, `longitude ∈ [-180, 180]`, valid `YYYY-MM-DD` dates, `startDate ≤ endDate`, range `≤ 31 days`, dates not in the future.

**Response** (`201` created / `200` cached):
```json
{
  "cached": false,
  "dataset": {
    "id": 1,
    "filename": "weather_40.7128_-74.006_2024-06-01_2024-06-05.json.gz",
    "latitude": 40.7128,
    "longitude": -74.006,
    "startDate": "2024-06-01",
    "endDate": "2024-06-05",
    "locationLabel": "New York City",
    "storageProvider": "database",
    "fileSizeBytes": 1842,
    "recordCount": 5,
    "avgTemperature": 22.5,
    "maxTemperature": 28.3,
    "minTemperature": 16.1,
    "cacheHits": 0,
    "createdAt": "2026-08-06T12:00:00.000Z",
    "updatedAt": "2026-08-06T12:00:00.000Z"
  }
}
```

**Errors:** `422` validation failure, `502` upstream API failure.

### `GET /api/weather/files`

Paginated, sortable, searchable dataset listing.

**Query params:** `page` (default 1), `pageSize` (1–100, default 10), `search`, `sortBy` (createdAt, filename, fileSizeBytes, avgTemperature, latitude, longitude), `sortDirection` (asc/desc).

**Response:**
```json
{
  "items": [{ "id": 1, "filename": "weather_...json.gz", ... }],
  "total": 4,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

### `GET /api/weather/files/{filename}`

Full dataset content with computed analytics and raw payload.

**Response:**
```json
{
  "dataset": { ... },
  "analytics": {
    "rows": [{ "date": "2024-06-01", "tempMax": 28.3, "tempMin": 16.1, "avgTemp": 22.2, "movingAverage": 22.2, ... }],
    "summary": { "highestTemperature": 28.3, "lowestTemperature": 16.1, "averageTemperature": 22.5, "standardDeviation": 3.2, "warmestDay": { ... }, "coldestDay": { ... }, "dayCount": 5 }
  },
  "raw": { ... }
}
```

### `DELETE /api/weather/files/{filename}`

Removes the dataset metadata and the underlying stored object.

### `GET /api/weather/files/{filename}/download?format=json|csv|gz`

Downloads the dataset as a file attachment in the requested format (defaults to JSON).

### `GET /api/weather/stats`

Aggregated dashboard metrics.

**Response:**
```json
{
  "totalFiles": 4,
  "totalBytes": 7200,
  "uniqueLocations": 3,
  "averageTemperature": 24.5,
  "totalCacheHits": 2,
  "latest": { ... }
}
```

### `GET /api/health`

Liveness/readiness probe — verifies database connectivity and reports storage backend status. Returns `200` healthy or `503` unhealthy.

### `GET /api/metrics?format=prometheus`

Runtime metrics (uptime, memory, dataset counts, cache hits). Returns JSON by default or Prometheus-compatible plain text with `?format=prometheus`.

### `GET /api/version`

Build and version metadata.

## Dashboard Features

The frontend dashboard is organized into four tabs:

| Tab | Description |
|---|---|
| **Overview** | Fleet-wide metrics (total files, storage used, unique locations, average temperature, cache hits), recent datasets |
| **Fetch Data** | Weather query form with coordinate input, interactive Leaflet map picker, example location shortcuts, date range selection, real-time validation |
| **Datasets** | Paginated table of stored archives with search and sorting, slide-out detail viewer with charts, analytics grid, raw JSON inspector, multi-format export (JSON, CSV, PDF, gzip) |
| **API & Health** | Live API reference, health status, service metrics |

## Local Setup

```bash
npm install
npm run db:push       # creates the weather_datasets table
npm run dev           # http://localhost:3000
```

### Environment Variables (`.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `STORAGE_PROVIDER` | No | `local` | Storage backend: `local`, `database`, or `s3` |
| `STORAGE_LOCAL_DIR` | No | `.data/weather-objects` | Directory for local filesystem storage (dev only) |
| `OPEN_METEO_BASE_URL` | No | `https://archive-api.open-meteo.com/v1/archive` | Open-Meteo API base URL |
| `OPEN_METEO_TIMEOUT_MS` | No | `15000` | Request timeout for Open-Meteo calls |
| `OPEN_METEO_MAX_RETRIES` | No | `3` | Max retry attempts on transient failures |
| `RATE_LIMIT_MAX_REQUESTS` | No | `60` | Max requests per rate-limit window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate-limit window duration (ms) |
| `APP_VERSION` | No | `1.0.0` | Application version string |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |
| `AWS_S3_BUCKET` | No | — | S3 bucket name (enables S3 backend) |
| `AWS_ACCESS_KEY_ID` | No | — | AWS credential for S3 backend |
| `AWS_SECRET_ACCESS_KEY` | No | — | AWS credential for S3 backend |
| `AWS_REGION` | No | — | AWS region for S3 backend |

> **Production safety:** `STORAGE_PROVIDER=local` is rejected in production (`NODE_ENV=production`) because Vercel Serverless Functions have ephemeral filesystems. Use `database` or `s3` instead.

## Storage Provider Selection

The storage factory (`src/storage/storage-factory.ts`) selects the active backend with this priority:

1. **S3** — if `STORAGE_PROVIDER=s3` and all AWS credentials are present
2. **Database** — if `STORAGE_PROVIDER=database` or `NODE_ENV=production`
3. **Local** — only in `development` or `test` environments

To switch to real AWS S3:
1. Create an S3 bucket and an IAM user with `s3:GetObject`, `s3:PutObject`, `s3:ListBucket` permissions.
2. Set `STORAGE_PROVIDER=s3`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION` in your environment.
3. Redeploy — no code changes required.

## Deployment

This is a standard Next.js app, deployable to **Vercel** (free tier):

1. Push this repo to GitHub.
2. Import in Vercel → set `DATABASE_URL` to a free Postgres instance (e.g. [Neon](https://neon.tech) or [Supabase](https://supabase.com)).
3. Set `STORAGE_PROVIDER=database` in Vercel environment variables.
4. Run `npx drizzle-kit push` once against the production database URL to create the `weather_datasets` table.
5. Deploy. Optionally add AWS env vars to use S3 storage instead.

### npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run db:push` | Push schema to database (`drizzle-kit push`) |
| `npm run db:studio` | Open Drizzle Studio for database inspection |

## Known Limitations / Trade-offs

- **No authentication** — all endpoints are public. A production version would add API keys or JWT auth in front of mutating endpoints.
- **In-memory rate limiting** — the rate limiter is per-process and resets on serverless function cold starts. A production deployment would use Redis or a shared store.
- **Open-Meteo ingestion delay** — the archive API has a short delay (~2 days) for the most recent data, so very recent `endDate` values may return `null` for those days. This is upstream behavior, not a bug.
- **No automated test suite** — testing is manual / type-driven (`tsc --noEmit`, `npm run build`). A production version would add Vitest or Jest unit tests.
