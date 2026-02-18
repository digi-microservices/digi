import { type Context } from "../context.js";

export function requireAuth(ctx: Context): asserts ctx is Context & {
  user: NonNullable<Context["user"]>;
  session: NonNullable<Context["session"]>;
} {
  if (!ctx.user || !ctx.session) {
    throw new Error("Unauthorized");
  }
  if (ctx.user.suspended) {
    throw new Error("Account suspended");
  }
}
