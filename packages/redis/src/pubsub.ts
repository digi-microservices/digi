import Redis from "ioredis";

export interface PubSub {
  publish(channel: string, message: unknown): Promise<void>;
  subscribe(
    channel: string,
    handler: (message: unknown) => void
  ): Promise<() => void>;
}

export function createPubSub(redisUrl: string): PubSub {
  const publisher = new Redis(redisUrl);
  const subscriber = new Redis(redisUrl);
  const handlers = new Map<string, Set<(message: unknown) => void>>();

  subscriber.on("message", (channel: string, message: string) => {
    const channelHandlers = handlers.get(channel);
    if (!channelHandlers) return;
    const parsed = JSON.parse(message);
    for (const handler of channelHandlers) {
      handler(parsed);
    }
  });

  return {
    async publish(channel: string, message: unknown): Promise<void> {
      await publisher.publish(channel, JSON.stringify(message));
    },

    async subscribe(
      channel: string,
      handler: (message: unknown) => void
    ): Promise<() => void> {
      if (!handlers.has(channel)) {
        handlers.set(channel, new Set());
        await subscriber.subscribe(channel);
      }
      handlers.get(channel)!.add(handler);

      return async () => {
        const channelHandlers = handlers.get(channel);
        if (channelHandlers) {
          channelHandlers.delete(handler);
          if (channelHandlers.size === 0) {
            handlers.delete(channel);
            await subscriber.unsubscribe(channel);
          }
        }
      };
    },
  };
}

// PubSub channel helpers
export const Channels = {
  containerLogs: (serviceId: string, containerId: string) =>
    `logs:${serviceId}:${containerId}`,
  deploymentStatus: (jobId: string) => `deployment:${jobId}`,
  jobNew: () => `jobs:new`,
} as const;
