// -----------------------------------------------------------------------------
// Custom, structured error hierarchy.
//
// Using typed error classes (instead of throwing plain strings / generic
// Errors) lets the centralized error-handling middleware map failures to the
// correct HTTP status code and produce consistent, machine-readable API
// responses — a pattern borrowed from production FastAPI/NestJS services.
// -----------------------------------------------------------------------------

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "STORAGE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(message: string, statusCode: number, code: ErrorCode, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Request validation failed", details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", details?: unknown) {
    super(message, 429, "RATE_LIMITED", details);
  }
}

export class UpstreamServiceError extends AppError {
  constructor(message = "Upstream service failure", details?: unknown) {
    super(message, 502, "UPSTREAM_ERROR", details);
  }
}

export class StorageError extends AppError {
  constructor(message = "Storage operation failed", details?: unknown) {
    super(message, 500, "STORAGE_ERROR", details);
  }
}
