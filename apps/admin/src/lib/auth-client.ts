import { createAuthClient } from "@digi/auth/client";
import { env } from "~/env";

// Use admin URL so auth requests go through Next.js rewrite proxy
// This avoids CORS issues since requests stay same-origin
export const authClient = createAuthClient(
  `${env.NEXT_PUBLIC_ADMIN_URL}`,
);


