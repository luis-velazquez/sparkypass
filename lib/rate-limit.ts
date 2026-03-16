/**
 * Simple in-memory rate limiter for API route protection.
 *
 * In production with multiple server instances, replace the in-memory Map
 * with a shared store such as Redis or Upstash.
 */

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

/**
 * Creates a rate limiter with configurable window and max requests.
 *
 * @param options.windowMs - Time window in milliseconds
 * @param options.max - Maximum number of requests allowed within the window
 */
export function rateLimit(options: { windowMs: number; max: number }): {
  check: (ip: string) => RateLimitResult;
} {
  const { windowMs, max } = options;
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup of expired entries to prevent memory leaks
  function cleanup() {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt < now) {
        store.delete(key);
      }
    }
  }

  return {
    check(ip: string): RateLimitResult {
      const now = Date.now();

      // Clean up when the store grows large
      if (store.size > 10_000) {
        cleanup();
      }

      const entry = store.get(ip);

      // First request or window expired — start fresh
      if (!entry || entry.expiresAt < now) {
        store.set(ip, { count: 1, expiresAt: now + windowMs });
        return { success: true, remaining: max - 1 };
      }

      // Within window — check limit
      if (entry.count >= max) {
        return { success: false, remaining: 0 };
      }

      // Increment and allow
      entry.count++;
      return { success: true, remaining: max - entry.count };
    },
  };
}

/**
 * Extract the client IP address from a Request.
 * Works behind reverse proxies (Vercel, Cloudflare, nginx, etc.).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
