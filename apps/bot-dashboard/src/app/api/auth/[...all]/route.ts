import { toNextJsHandler } from "better-auth/next-js";
import { createAuth } from "@digi/auth/server";
import { createDb } from "@digi/db";

const db = createDb(process.env.DATABASE_URL!);

const auth = createAuth({
  db,
  baseURL: process.env.NEXT_PUBLIC_SUPPORT_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,

  discord: {
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  },
});

export const GET = auth.handler;
export const POST = auth.handler;
export const PUT = auth.handler;
export const DELETE = auth.handler;
export const PATCH = auth.handler;
