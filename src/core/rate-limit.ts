// -----------------------------------------------------------------------------
// In-memory, per-IP sliding-window rate limiter.
//
// NOTE (production trade-off): this uses process memory, which works for a
// single Next.js instance but does not coordinate across horizontally-scaled
// replicas. In a multi-instance deployment this would be swapped for a Redis
// (or Upstash) backed token bucket behind the same `RateLimiter` interface —
// the call sites in `src/middleware` would not need to change.
// -----------------------------------------------------------------------------
import { config } from "@/core/config";

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Periodically sweep stale buckets so memory does not grow unbounded.
const SWEEP_INTERVAL_MS = 5 * 60_000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > config.rateLimit.windowMs) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const { maxRequests, windowMs } = config.rateLimit;
  const existing = buckets.get(identifier);

  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1, limit: maxRequests, resetMs: windowMs };
  }

  existing.count += 1;
  const allowed = existing.count <= maxRequests;
  return {
    allowed,
    remaining: Math.max(0, maxRequests - existing.count),
    limit: maxRequests,
    resetMs: windowMs - (now - existing.windowStart),
  };
}
