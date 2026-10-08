import Redis from "ioredis";

// Default is the standard Redis port. Pathway's sandbox runs Redis on 6379.
// If your local Redis is on 6380, set REDIS_URL in backend/.env instead.
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1, // fail a command quickly instead of retrying it
  enableOfflineQueue: false, // reject immediately while disconnected, don't queue
  connectTimeout: 1000,
  retryStrategy: (times) => Math.min(times * 200, 2000), // keep reconnecting in the background
});

redis.on("error", (err) => {
  // Don't crash the app if Redis hiccups — caching is an optimization,
  // not a hard dependency. Reads/writes fall back gracefully (see cache.ts).
  console.error("[redis] connection error:", err.message);
});

redis.on("connect", () => {
  console.log("[redis] connected");
});

/**
 * Safe wrapper helpers so a Redis outage never takes down the API.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // swallow — non-critical
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  try {
    if (pattern.includes("*")) {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys);
    } else {
      await redis.del(pattern);
    }
  } catch {
    // swallow — non-critical
  }
}
