import Redis from "ioredis";

export type RedisClient = Redis;

let instance: Redis | null = null;

export function createRedisClient(url: string): Redis {
  if (instance) return instance;
  instance = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
  return instance;
}
