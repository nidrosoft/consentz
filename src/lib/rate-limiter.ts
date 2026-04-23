// =============================================================================
// In-Memory Rate Limiter
// Replace with Redis-based limiter in production
// =============================================================================

export type RateLimitCategory = 'default' | 'assessment' | 'aiGeneration' | 'aiVerification' | 'upload' | 'export' | 'cron';

const RATE_LIMITS: Record<RateLimitCategory, { maxRequests: number; windowMs: number }> = {
  default: { maxRequests: 60, windowMs: 60_000 },
  assessment: { maxRequests: 10, windowMs: 60_000 },
  aiGeneration: { maxRequests: 3, windowMs: 600_000 },
  aiVerification: { maxRequests: 10, windowMs: 600_000 },
  upload: { maxRequests: 20, windowMs: 60_000 },
  export: { maxRequests: 5, windowMs: 300_000 },
  cron: { maxRequests: 1, windowMs: 60_000 },
};

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();
let callCount = 0;

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  userId: string,
  category: RateLimitCategory = 'default',
): { allowed: boolean; remaining: number; resetTime: number } {
  // Periodic cleanup every 1000 calls
  if (++callCount % 1000 === 0) cleanup();

  const config = RATE_LIMITS[category];
  const key = `${userId}:${category}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  store.set(key, entry);
  return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}
