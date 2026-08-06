// -----------------------------------------------------------------------------
// Storage abstraction (Strategy pattern / Dependency Inversion Principle).
//
// The rest of the application depends only on this interface, never on a
// concrete provider. This lets us run entirely on local disk in the sandbox
// / CI while transparently upgrading to AWS S3 in production simply by
// setting environment variables — no application code changes required.
// -----------------------------------------------------------------------------

export interface StoredObjectMeta {
  /** Fully qualified location, e.g. `s3://bucket/key`, `local://path`, or `db://key` */
  path: string;
  bucket: string | null;
  sizeBytes: number;
  provider: "local" | "s3" | "database";
}

export interface WeatherStorageProvider {
  readonly provider: "local" | "s3" | "database";

  /** Persist a gzip-compressed JSON buffer under `key`. Returns storage metadata. */
  putObject(key: string, body: Buffer, contentType?: string): Promise<StoredObjectMeta>;

  /** Retrieve a previously stored object as a Buffer. */
  getObject(key: string): Promise<Buffer>;

  /** Remove an object. Should be idempotent (no error if missing). */
  deleteObject(key: string): Promise<void>;

  /** Whether an object exists under `key`. */
  exists(key: string): Promise<boolean>;
}
