import { createAuthClient } from "@digi/auth/client";
import { env } from "~/env";

export const authClient = createAuthClient(
  env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
);
