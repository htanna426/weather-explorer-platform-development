// -----------------------------------------------------------------------------
// Cross-cutting API middleware: request logging, rate limiting, CORS, and
// centralized error handling — composed around every route handler via
// `withApiHandler`. This keeps route files focused purely on orchestrating
// calls into the service layer (no try/catch boilerplate, no duplicated
// header logic).
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { AppError } from "@/core/errors";
import { logger } from "@/core/logger";
import { checkRateLimit } from "@/core/rate-limit";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.CORS_ALLOWED_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Request-Id",
};

function clientIdentifier(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

function errorBody(requestId: string, message: string, code: string, details?: unknown) {
  return { error: { message, code, details: details ?? null }, requestId };
}

function serializeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const cause = (error as { cause?: unknown }).cause;
  const parts = [error.stack ?? error.message];

  if (cause instanceof Error) {
    parts.push(`Caused by: ${cause.message}`, cause.stack ?? "");
  } else if (cause !== undefined) {
    parts.push(`Caused by: ${String(cause)}`);
  }

  return parts.filter(Boolean).join("\n");
}

type RouteHandler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

interface HandlerOptions {
  /** Disable rate limiting for read-only, cheap endpoints like /health. */
  rateLimit?: boolean;
}

export function withApiHandler(handler: RouteHandler, options: HandlerOptions = {}): RouteHandler {
  const rateLimitEnabled = options.rateLimit ?? true;

  return async (req, ctx) => {
    const requestId = req.headers.get("x-request-id") ?? randomUUID();
    const startedAt = Date.now();
    const method = req.method;
    const path = new URL(req.url).pathname;

    try {
      if (rateLimitEnabled) {
        const identity = clientIdentifier(req);
        const result = checkRateLimit(identity);
        if (!result.allowed) {
          logger.warn("http.rate_limited", { requestId, method, path, identity });
          return NextResponse.json(errorBody(requestId, "Rate limit exceeded. Please slow down.", "RATE_LIMITED"), {
            status: 429,
            headers: {
              ...CORS_HEADERS,
              "X-Request-Id": requestId,
              "Retry-After": Math.ceil(result.resetMs / 1000).toString(),
            },
          });
        }
      }

      const response = await handler(req, ctx);
      const durationMs = Date.now() - startedAt;

      response.headers.set("X-Request-Id", requestId);
      Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));

      logger.info("http.request.completed", {
        requestId,
        method,
        path,
        status: response.status,
        durationMs,
      });

      return response;
    } catch (error) {
      const durationMs = Date.now() - startedAt;

      if (error instanceof ZodError) {
        logger.warn("http.request.validation_error", { requestId, method, path, durationMs, issues: error.issues });
        return NextResponse.json(
          errorBody(requestId, "Request validation failed", "VALIDATION_ERROR", error.flatten()),
          { status: 422, headers: { ...CORS_HEADERS, "X-Request-Id": requestId } },
        );
      }

      if (error instanceof AppError) {
        logger.warn("http.request.app_error", {
          requestId,
          method,
          path,
          durationMs,
          status: error.statusCode,
          code: error.code,
          message: error.message,
        });
        return NextResponse.json(errorBody(requestId, error.message, error.code, error.details), {
          status: error.statusCode,
          headers: { ...CORS_HEADERS, "X-Request-Id": requestId },
        });
      }

      logger.error("http.request.unhandled_error", {
        requestId,
        method,
        path,
        durationMs,
        error: serializeError(error),
      });

      return NextResponse.json(errorBody(requestId, "An unexpected error occurred", "INTERNAL_ERROR"), {
        status: 500,
        headers: { ...CORS_HEADERS, "X-Request-Id": requestId },
      });
    }
  };
}
