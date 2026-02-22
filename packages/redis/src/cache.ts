import { type RedisClient } from "./client";

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

export function createCache(redis: RedisClient): Cache {
  return {
    async get<T>(key: string): Promise<T | null> {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    },

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    },

    async del(key: string): Promise<void> {
      await redis.del(key);
    },

    async invalidatePattern(pattern: string): Promise<void> {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    },
  };
}

// Cache key helpers
export const CacheKeys = {
  session: (token: string) => `session:${token}`,
  userServices: (userId: string) => `user:${userId}:services`,
  vmStats: (vmId: string) => `vm:${vmId}:stats`,
  domainList: () => `domains:list`,
  adminPassword: () => `admin:password`,
  userSubscription: (userId: string) => `user:${userId}:subscription`,
  rateLimit: (userId: string, window: string) =>
    `ratelimit:${userId}:${window}`,
} as const;

// Cache TTLs in seconds
export const CacheTTL = {
  SESSION: 60 * 60 * 24 * 7, // 7 days
  USER_SERVICES: 30,
  VM_STATS: 10,
  DOMAIN_LIST: 60,
  ADMIN_PASSWORD: 60 * 60 * 24, // 24 hours
  USER_SUBSCRIPTION: 60 * 5, // 5 minutes
} as const;
