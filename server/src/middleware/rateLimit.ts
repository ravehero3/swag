import { Request, Response, NextFunction } from "express";

// ─────────────────────────────────────────────────────────────────────────────
// Minimal in-memory rate limiter. No new dependency (no express-rate-limit)
// per the "don't introduce unnecessary infra" rule — this is a single Docker
// process, so an in-memory token-bucket-per-IP is sufficient and correct.
// Protects public marketing endpoints (lead signup, unsubscribe, webhook)
// from being trivially spammed.
// ─────────────────────────────────────────────────────────────────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically sweep expired buckets so this never grows unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(options: { windowMs: number; max: number; keyPrefix: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > options.max) {
      return res.status(429).json({ error: "Příliš mnoho požadavků. Zkuste to prosím později." });
    }

    next();
  };
}
