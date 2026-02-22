import { type Context } from "../context";
import { AuthenticationError } from "../errors";

export function requireAuth(ctx: Context): asserts ctx is Context & {
  user: NonNullable<Context["user"]>;
  session: NonNullable<Context["session"]>;
} {
  if (!ctx.user || !ctx.session) {
    throw new AuthenticationError();
  }
  if (ctx.user.suspended) {
    throw new AuthenticationError("Your account has been suspended");
  }
}
