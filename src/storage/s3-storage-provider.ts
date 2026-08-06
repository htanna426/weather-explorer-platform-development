// -----------------------------------------------------------------------------
// AWS S3-backed storage provider.
//
// Activated automatically when `STORAGE_PROVIDER=s3` (and AWS credentials are
// present) via `storage-factory.ts`. Implements the same
// `WeatherStorageProvider` contract as the local provider so the rest of the
// codebase is completely storage-agnostic.
// -----------------------------------------------------------------------------
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { config } from "@/core/config";
import { StorageError } from "@/core/errors";
import type { StoredObjectMeta, WeatherStorageProvider } from "./storage-provider";

export class S3StorageProvider implements WeatherStorageProvider {
  readonly provider = "s3" as const;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const { region, bucket, accessKeyId, secretAccessKey } = config.storage.aws;
    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new StorageError("S3 storage provider requires AWS_REGION, AWS_S3_BUCKET, and credentials");
    }
    this.bucket = bucket;
    this.client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  }

  async putObject(key: string, body: Buffer, contentType = "application/gzip"): Promise<StoredObjectMeta> {
    try {
      await this.client.send(
        new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
      );
      return { path: `s3://${this.bucket}/${key}`, bucket: this.bucket, sizeBytes: body.byteLength, provider: "s3" };
    } catch (error) {
      throw new StorageError("Failed to upload object to S3", { cause: String(error) });
    }
  }

  async getObject(key: string): Promise<Buffer> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) throw new Error("Empty response body");
      return Buffer.from(bytes);
    } catch (error) {
      throw new StorageError("Failed to download object from S3", { cause: String(error) });
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      throw new StorageError("Failed to delete object from S3", { cause: String(error) });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}
