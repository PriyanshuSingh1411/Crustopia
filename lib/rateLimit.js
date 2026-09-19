// Lightweight in-memory rate limiter for brute-force protection on
// auth endpoints (login/register/admin-login).
//
// NOTE: this is per-process/in-memory. It's a real improvement over
// having no limiting at all, and is fine for a single-instance
// deployment. If you deploy multiple instances behind a load balancer,
// replace this with a shared store (Redis/Upstash) so limits are
// enforced across all instances.

const buckets = new Map();

// Periodically sweep old entries so this doesn't grow forever.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
      if (now - entry.windowStart > entry.windowMs) buckets.delete(key);
    }
  },
  5 * 60 * 1000,
).unref?.();

/**
 * @param {string} key   Unique bucket key, e.g. `login:${ip}:${email}`
 * @param {number} limit Max attempts allowed within the window
 * @param {number} windowMs Window size in ms
 * @returns {{ allowed: boolean, retryAfterSeconds: number }}
 */
export function checkRateLimit(key, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now, windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfterSeconds = Math.ceil(
      (entry.windowStart + windowMs - now) / 1000,
    );
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP from a Next.js Request. */
export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
