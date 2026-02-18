import { type Context } from "../context.js";
import { requireAuth } from "./auth.js";

export function requireAdmin(ctx: Context): asserts ctx is Context & {
  user: NonNullable<Context["user"]> & { role: "admin" };
  session: NonNullable<Context["session"]>;
} {
  requireAuth(ctx);
  if (ctx.user.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }
}
