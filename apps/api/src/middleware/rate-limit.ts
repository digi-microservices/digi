import { type RedisClient } from "@digi/redis";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export async function checkRateLimit(
  redis: RedisClient,
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const redisKey = `ratelimit:${key}`;

  // Remove expired entries
  await redis.zremrangebyscore(redisKey, 0, windowStart);

  // Count current window
  const count = await redis.zcard(redisKey);

  if (count >= config.maxRequests) {
    const oldestEntry = await redis.zrange(redisKey, 0, 0, "WITHSCORES");
    const resetAt = oldestEntry[1]
      ? parseInt(oldestEntry[1]) + config.windowMs
      : now + config.windowMs;

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Add current request
  await redis.zadd(redisKey, now, `${now}-${Math.random()}`);
  await redis.pexpire(redisKey, config.windowMs);

  return {
    allowed: true,
    remaining: config.maxRequests - count - 1,
    resetAt: now + config.windowMs,
  };
}

export const API_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
};
