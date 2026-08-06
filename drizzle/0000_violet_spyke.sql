CREATE TABLE "weather_datasets" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"location_label" text,
	"storage_provider" varchar(32) NOT NULL,
	"storage_path" text NOT NULL,
	"bucket" varchar(255),
	"file_size_bytes" integer NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"payload" "bytea",
	"status" varchar(16) DEFAULT 'completed' NOT NULL,
	"cache_hits" integer DEFAULT 0 NOT NULL,
	"source_url" text,
	"avg_temperature" double precision,
	"max_temperature" double precision,
	"min_temperature" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weather_datasets_filename_unique" UNIQUE("filename")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "weather_datasets_request_hash_idx" ON "weather_datasets" USING btree ("request_hash");--> statement-breakpoint
CREATE INDEX "weather_datasets_created_at_idx" ON "weather_datasets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "weather_datasets_status_idx" ON "weather_datasets" USING btree ("status");