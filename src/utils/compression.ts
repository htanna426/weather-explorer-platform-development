import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export async function compressJson(payload: unknown): Promise<Buffer> {
  const json = JSON.stringify(payload);
  return gzipAsync(Buffer.from(json, "utf-8"));
}

export async function decompressToJson<T = unknown>(buffer: Buffer): Promise<T> {
  const raw = await gunzipAsync(buffer);
  return JSON.parse(raw.toString("utf-8")) as T;
}
