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
import { env } from "./env";
import { createContextFactory } from "./context";
import { schema } from "./schema/index";
import { createStripeWebhookHandler } from "./webhooks/stripe";
import { startJobWorker } from "./queue/worker";
import { startPasswordRotation } from "./services/password.service";
import { mountCliAuthRoutes } from "./routes/cli-auth";
import { checkRateLimit, API_RATE_LIMIT } from "./middleware/rate-limit";

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
  discord:
    env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
      ? {
          clientId: env.DISCORD_CLIENT_ID,
          clientSecret: env.DISCORD_CLIENT_SECRET,
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

const AUTH_RATE_LIMIT = { windowMs: 60 * 1000, maxRequests: 20 };

// Create Elysia app
const baseApp = new Elysia()
  .use(
    cors({
      origin: (env.ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
        .concat([
          "http://app.localhost",
          "http://admin.localhost",
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://localhost:3003",
          "http://support.localhost",
        ]),
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  // Mount better-auth handler with rate limit
  .all("/api/auth/*", async (ctx) => {
    const ip =
      ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rl = await checkRateLimit(redis, `auth:${ip}`, AUTH_RATE_LIMIT);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      });
    }
    return auth.handler(ctx.request);
  })
  // Mount GraphQL with rate limit
  .all("/graphql", async (ctx) => {
    const ip =
      ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rl = await checkRateLimit(redis, `gql:${ip}`, API_RATE_LIMIT);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({
          errors: [
            {
              message: "Too Many Requests",
              extensions: { code: "RATE_LIMITED" },
            },
          ],
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }
    return yoga.handle(ctx.request);
  })
  // Stripe webhook
  .post("/webhooks/stripe", (ctx) => {
    return createStripeWebhookHandler(db, cache)(ctx.request);
  })
  // Health check
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

// Mount CLI auth routes
const app = mountCliAuthRoutes(baseApp as unknown as Elysia, {
  auth,
  db,
  redis,
}).listen(env.PORT);

// Start background processes
startJobWorker(db, redis, pubsub, cache);
startPasswordRotation(db);

console.log(`Digi API running at http://localhost:${env.PORT}`);
console.log(`GraphQL playground at http://localhost:${env.PORT}/graphql`);

export type App = typeof app;
