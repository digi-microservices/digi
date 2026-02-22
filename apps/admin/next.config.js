/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.ts";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["@digi/db", "@digi/auth", "@digi/shared", "@digi/ui"],
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://api.localhost";
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/api/auth/:path*`,
      },
      {
        source: "/api/graphql",
        destination: `${apiUrl}/graphql`,
      },
    ];
  },
};

export default config;
