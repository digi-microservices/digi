import { type RedisClient } from "./client.js";
import { type PubSub, Channels } from "./pubsub.js";

export interface JobData {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  maxAttempts: number;
}

type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

export interface JobQueue {
  enqueue(
    type: string,
    payload: Record<string, unknown>,
    db: EnqueueDb
  ): Promise<string>;
  process(handlers: Record<string, JobHandler>, db: ProcessDb): void;
  stop(): void;
}

// Minimal DB interface for enqueue (insert a job row)
export interface EnqueueDb {
  insertJob(job: {
    id: string;
    type: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

// Minimal DB interface for process (claim + update job rows)
export interface ProcessDb {
  claimNextJob(): Promise<JobData | null>;
  completeJob(id: string): Promise<void>;
  failJob(id: string, error: string): Promise<void>;
  retryJob(id: string, error: string): Promise<void>;
}

export function createJobQueue(
  redis: RedisClient,
  pubsub: PubSub
): JobQueue {
  let running = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  return {
    async enqueue(
      type: string,
      payload: Record<string, unknown>,
      db: EnqueueDb
    ): Promise<string> {
      const id = crypto.randomUUID();
      await db.insertJob({ id, type, payload });
      await pubsub.publish(Channels.jobNew(), { id, type });
      return id;
    },

    process(handlers: Record<string, JobHandler>, db: ProcessDb): void {
      running = true;

      const processNext = async () => {
        if (!running) return;

        const job = await db.claimNextJob();
        if (!job) return;

        const handler = handlers[job.type];
        if (!handler) {
          await db.failJob(job.id, `No handler for job type: ${job.type}`);
          return;
        }

        try {
          await handler(job.payload);
          await db.completeJob(job.id);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          if (job.attempts + 1 >= job.maxAttempts) {
            await db.failJob(job.id, error);
          } else {
            await db.retryJob(job.id, error);
          }
        }
      };

      // Poll every 5 seconds as fallback
      pollInterval = setInterval(() => {
        void processNext();
      }, 5000);

      // Also listen for Redis notifications for instant wake
      void pubsub.subscribe(Channels.jobNew(), () => {
        void processNext();
      });

      // Process immediately on start
      void processNext();
    },

    stop(): void {
      running = false;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    },
  };
}
