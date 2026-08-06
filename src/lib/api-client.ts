// -----------------------------------------------------------------------------
// Thin Axios wrapper used by every React Query hook. Centralizing base URL,
// timeouts, and error normalization here means components/hooks never touch
// Axios directly (they only see typed data or a normalized `ApiClientError`).
// -----------------------------------------------------------------------------
import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "@/types/api";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code: string, requestId?: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 45_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    if (body?.error) {
      throw new ApiClientError(body.error.message, status, body.error.code, body.requestId, body.error.details);
    }

    throw new ApiClientError(error.message || "Network error — please check your connection", status, "NETWORK_ERROR");
  },
);
