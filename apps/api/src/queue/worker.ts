import { eq, and } from "drizzle-orm";
import { jobs } from "@digi/db/schema";
import { type Database } from "@digi/db";
import { type RedisClient } from "@digi/redis";
import { type Cache } from "@digi/redis/cache";
import { type PubSub, Channels } from "@digi/redis/pubsub";
import { executeDeploy } from "../services/deployment.service";
import { executeDestroy } from "./handlers/destroy.handler";

export function startJobWorker(
  db: Database,
  redis: RedisClient,
  pubsub: PubSub,
  cache: Cache,
): void {
  let running = true;

  const processNext = async () => {
    if (!running) return;

    try {
      // Claim next pending job
      const pendingJobs = await db.query.jobs.findMany({
        where: eq(jobs.status, "pending"),
        orderBy: (j, { asc }) => [asc(j.scheduledAt)],
        limit: 1,
      });

      const job = pendingJobs[0];
      if (!job) return;

      // Attempt to claim via status update
      const result = await db
        .update(jobs)
        .set({
          status: "processing",
          startedAt: new Date(),
          attempts: job.attempts + 1,
        })
        .where(and(eq(jobs.id, job.id), eq(jobs.status, "pending")))
        .returning();

      if (!result.length) return; // Already claimed by another worker

      console.log(`[WORKER] Processing job ${job.id} (${job.type})`);

      const payload = job.payload as Record<string, unknown>;

      switch (job.type) {
        case "deploy":
          await executeDeploy(db, cache, pubsub, {
            serviceId: payload.serviceId as string,
            deploymentId: payload.deploymentId as string,
          });
          break;

        case "destroy":
          await executeDestroy(db, cache, payload);
          break;

        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Mark completed
      await db
        .update(jobs)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(jobs.id, job.id));

      console.log(`[WORKER] Job ${job.id} completed`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[WORKER] Job processing error:`, error);
    }
  };

  // Poll every 5 seconds
  const interval = setInterval(() => {
    void processNext();
  }, 5000);

  // Listen for Redis notifications for instant wake
  void pubsub.subscribe(Channels.jobNew(), () => {
    void processNext();
  });

  // Process immediately on start
  void processNext();

  console.log("[WORKER] Job worker started");
}
