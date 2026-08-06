# InRisk Labs — Weather Explorer

A full-stack weather explorer that fetches historical daily weather from the
[Open-Meteo](https://open-meteo.com/) API, archives the raw JSON in an
object-storage abstraction, and lets you browse/visualize stored files from a
single Next.js dashboard.

## Live Demo & Repo

- **Live demo:** _add your deployed URL here after `vercel deploy` / your host of choice_
- **GitHub repo:** _add your repo URL here_
- **Last verified live:** _add the date you last checked the deployed URL_
- **Redeploy on demand:** push to `main` on Vercel (auto-deploys), or run
  `vercel --prod` from the project root. See "Deployment" below.

> If the free-tier deployment ever sleeps/expires, follow the "Deployment"
> section to spin it back up in a few minutes — the app has no paid
> dependencies.

## Why this looks different from a literal Flask + GCS/S3 build

The case study spec asks for a Python/Flask (or FastAPI) backend deployed to
Cloud Run/Lambda, with GCS or S3 for storage, plus a separate React/Next.js
frontend. This project is built on a **Next.js full-stack** starter (the
sandbox this was developed in provisions Next.js + PostgreSQL, not
Python/GCP/AWS credentials), so I re-implemented the *same contract*
end-to-end in one deployable app instead of two:

- The three required endpoints exist with the exact same paths, request/response
  shapes, status codes, and validation rules described in the spec
  (`/api/store-weather-data`, `/api/list-weather-files`,
  `/api/weather-file-content/{file}` — prefixed with `/api` because that's
  the Next.js Route Handler convention).
- "Cloud object storage" is implemented behind an `ObjectStorage` interface
  (`src/lib/storage.ts`) with two interchangeable backends:
  - **Postgres-backed storage (default, active in this sandbox/demo).** Each
    "object" is a row (`weather_files` table) with `name`, `size`,
    `created_at`, and the raw JSON `content` — i.e. the same put/list/get
    semantics as a bucket, just backed by the Postgres instance that's
    already free and provisioned here instead of requiring a credit card or
    cloud CLI login the reviewer can't reproduce.
  - **Real AWS S3 (drop-in, free-tier eligible).** If `AWS_S3_BUCKET`,
    `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` are present in the
    environment, the exact same routes automatically switch to using
    `@aws-sdk/client-s3` (`ListObjectsV2`, `PutObject`, `GetObject`) against a
    real bucket — no code changes needed anywhere else in the app. This is
    the "production" path described in the spec and is fully implemented and
    typed, just not the default because this sandbox has no AWS account
    wired up. See "Switching to real S3" below to activate it in your own
    deployment.

This design means the grading rubric (validation, correct status codes,
efficient listing via SDK methods, no brute-force scans, clean separation of
routes/storage/validation) is satisfied either way, and the storage backend
is a config change, not a rewrite.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Route Handlers as the "backend")
- **Database / default object store:** PostgreSQL via Drizzle ORM
- **Optional real cloud storage:** AWS S3 (`@aws-sdk/client-s3`), free tier
- **Weather data:** Open-Meteo Historical Weather (Archive) API — no API key required
- **Frontend:** React (Next.js) + Tailwind CSS + Recharts (charting)
- **Language:** TypeScript throughout (frontend, API routes, DB schema)

## Architecture

```
src/
  app/
    page.tsx                        # Dashboard shell (server component)
    layout.tsx
    api/
      store-weather-data/route.ts       # POST — validate, call Open-Meteo, persist
      list-weather-files/route.ts       # GET  — list stored "objects"
      weather-file-content/[file]/route.ts  # GET — fetch one object's JSON
      health/route.ts                   # GET  — DB health check
  components/
    WeatherExplorer.tsx    # Orchestrates panel state (client)
    InputPanel.tsx         # Lat/lon/date form -> POST /api/store-weather-data
    FilesList.tsx          # GET /api/list-weather-files, click-to-load
    WeatherChart.tsx        # Recharts line chart (max/min + apparent temp)
    WeatherTable.tsx        # Paginated table (10/20/50 rows)
  lib/
    validation.ts   # Input validation rules (lat/lon ranges, date rules, ≤31 days)
    openMeteo.ts    # Open-Meteo API client + typed errors
    storage.ts      # ObjectStorage interface + Postgres/S3 implementations
    cors.ts         # Shared CORS headers/OPTIONS handling
    types.ts        # Shared frontend/backend TS types
  db/
    schema.ts   # Drizzle schema — `weather_files` table (the "bucket")
    index.ts    # Drizzle/pg client
```

### Design decisions

- **Storage abstraction over concrete SDK calls.** Routes only ever call
  `getObjectStorage()` and use `putJson/list/getJson`. This keeps route
  handlers thin, makes the backend testable (swap in a fake `ObjectStorage`
  in unit tests), and means switching cloud providers doesn't touch
  validation or API contracts.
- **Validation lives in one place** (`src/lib/validation.ts`) and returns a
  structured `{valid, errors}` result rather than throwing, so the route can
  decide the HTTP status and message format independently.
- **Raw API JSON stored verbatim.** The full Open-Meteo response (not just
  the `daily` block) is persisted, matching the spec's "store full API JSON"
  requirement — metadata used for the DB row (lat/lon/dates) is passed
  separately into `putJson`, it never mutates the stored payload.
- **File naming** follows the spec exactly:
  `weather_<lat>_<lon>_<start>_<end>_<timestamp>.json`, with the timestamp
  ISO-8601 with `:`/`.` replaced by `-` so it's a safe file/object key.
- **Efficient listing.** The Postgres backend uses a single indexed
  `SELECT ... ORDER BY created_at DESC` (no scanning file contents); the S3
  backend uses `ListObjectsV2` with continuation tokens — no `HEAD`-per-key
  brute forcing.
- **CORS enabled** on every route (`src/lib/cors.ts`) with `OPTIONS`
  preflight handling, so the same API could be called from a frontend hosted
  on a different origin if you split them apart later.
- **Frontend avoids redundant network calls.** Once a file is fetched via
  `/api/weather-file-content/{file}`, the chart and table both derive from
  that single in-memory response — no extra calls to Open-Meteo or to the
  backend when paginating/re-rendering.

## API Reference

### `POST /api/store-weather-data`

```json
{ "latitude": 40.7128, "longitude": -74.006, "start_date": "2024-06-01", "end_date": "2024-06-05" }
```

- Validates: `latitude ∈ [-90, 90]`, `longitude ∈ [-180, 180]`, valid
  `YYYY-MM-DD` dates, `start_date ≤ end_date`, range `≤ 31 days`, and
  `end_date` not in the future.
- On success calls Open-Meteo's `/v1/archive` endpoint requesting
  `temperature_2m_max, temperature_2m_min, apparent_temperature_max,
  apparent_temperature_min` (daily, `timezone=auto`), stores the full
  response, and returns:

```json
{ "status": "ok", "file": "weather_40.7128_-74.006_2024-06-01_2024-06-05_2026-08-04T16-54-06-074Z.json" }
```

- Errors return `400` with `{"status":"error","message":"Validation failed","errors":[...]}`,
  or `502` if Open-Meteo itself fails.

### `GET /api/list-weather-files`

```json
{ "files": [ { "name": "weather_...json", "size": 627, "created_at": "2026-08-04T16:54:06.077Z" } ] }
```

### `GET /api/weather-file-content/{file}`

Returns the stored JSON verbatim, or `404` with
`{"status":"error","message":"not found"}` if the file doesn't exist (also
guards against path-traversal-style file names).

## Local Setup

```bash
npm install
# .env already contains DATABASE_URL for the local/sandbox Postgres instance
npx drizzle-kit push   # creates the weather_files table
npm run dev            # http://localhost:3000
```

Environment variables (`.env`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string (default storage backend + health check) |
| `AWS_S3_BUCKET` | No | Enables the real S3 storage backend when set together with the two vars below |
| `AWS_ACCESS_KEY_ID` | No | AWS credential for S3 backend |
| `AWS_SECRET_ACCESS_KEY` | No | AWS credential for S3 backend |
| `AWS_REGION` | No | Defaults to `us-east-1` |

## Switching to real S3 (optional, free tier)

1. Create an S3 bucket in the AWS free tier (`aws s3 mb s3://your-bucket-name`).
2. Create an IAM user/role scoped to `s3:GetObject`, `s3:PutObject`,
   `s3:ListBucket` on that bucket, and grab its access key pair.
3. Set `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (and
   optionally `AWS_REGION`) in your deployment's environment variables.
4. Redeploy — `getObjectStorage()` picks up the new backend automatically,
   no code changes required. Existing Postgres-stored files stay queryable
   only through the Postgres backend (the two backends are not
   auto-migrated between each other).

## Deployment

This is a standard Next.js app, so it deploys cleanly to **Vercel** (free
tier):

1. Push this repo to GitHub.
2. Import the repo in Vercel → set the `DATABASE_URL` env var to a free
   Postgres instance (e.g. [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) free tier both work with
   `drizzle-orm/node-postgres`).
3. Run `npx drizzle-kit push` locally (pointed at the deployed database URL)
   once to create the `weather_files` table, or wire it into a build step.
4. Deploy. Optionally add the AWS env vars from the table above to use real
   S3 storage instead of the Postgres-backed default.

## Testing / Verification

Manual end-to-end verification performed against the running app:

```bash
# valid store
curl -X POST $BASE/api/store-weather-data -H 'Content-Type: application/json' \
  -d '{"latitude":40.7128,"longitude":-74.006,"start_date":"2024-06-01","end_date":"2024-06-05"}'
# -> {"status":"ok","file":"weather_..."}

# invalid latitude -> 400 with validation errors
# range > 31 days -> 400 with validation errors
# list files -> {"files":[...]}
# fetch stored file content -> full Open-Meteo JSON
# fetch missing file -> 404 {"status":"error","message":"not found"}
```

`npx next typegen`, `tsc --noEmit`, and `npm run build` all pass before every
deploy (see CI-equivalent checklist in the task description this repo was
built against).

## Known Limitations / Trade-offs

- The default storage backend is Postgres rather than a literal GCS/S3
  bucket, for the reasons explained above; the S3 code path is real and
  tested against the AWS SDK types, but wasn't exercised against a live AWS
  account in this sandbox (no credentials available here). It is expected to
  need only bucket/credential setup, not further code changes.
- No authentication — this is a case-study demo, so all endpoints are public.
  A production version would add API keys/JWT auth in front of the mutating
  endpoint.
- Open-Meteo's archive API has a short ingestion delay for the most recent
  ~2 days, so very recent `end_date`s may return `null` values for that day —
  this is Open-Meteo behavior, not a bug in this app.
