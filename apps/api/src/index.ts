import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createYoga } from "graphql-yoga";
import { createDb } from "@digi/db";
import { createAuth } from "@digi/auth/server";
import {
  createRedisClient,
  createCache,
  createPubSub,
  createJobQueue,
} from "@digi/redis";
import { env } from "./env.js";
import { createContextFactory } from "./context.js";
import { schema } from "./schema/index.js";
import { createStripeWebhookHandler } from "./webhooks/stripe.js";
import { startJobWorker } from "./queue/worker.js";
import { startPasswordRotation } from "./services/password.service.js";

// Initialize dependencies
const db = createDb(env.DATABASE_URL);
const redis = createRedisClient(env.REDIS_URL);
const cache = createCache(redis);
const pubsub = createPubSub(env.REDIS_URL);
const jobQueue = createJobQueue(redis, pubsub);

const auth = createAuth({
  db,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  github:
    env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        }
      : undefined,
});

const createContext = createContextFactory({ db, auth, cache, pubsub, redis });

// Create GraphQL Yoga instance
const yoga = createYoga({
  schema,
  context: ({ request }) => createContext(request),
  graphqlEndpoint: "/graphql",
  landingPage: true,
});

// Create Elysia app
const app = new Elysia()
  .use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
      ],
      credentials: true,
    })
  )
  // Mount better-auth handler
  .all("/api/auth/*", (ctx) => {
    return auth.handler(ctx.request);
  })
  // Mount GraphQL
  .all("/graphql", (ctx) => {
    return yoga.handle(ctx.request);
  })
  // Stripe webhook
  .post("/webhooks/stripe", (ctx) => {
    return createStripeWebhookHandler(db, cache)(ctx.request);
  })
  // Health check
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .listen(env.PORT);

// Start background processes
startJobWorker(db, redis, pubsub, cache);
startPasswordRotation(db);

console.log(`Digi API running at http://localhost:${env.PORT}`);
console.log(`GraphQL playground at http://localhost:${env.PORT}/graphql`);

export type App = typeof app;
