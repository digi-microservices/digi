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
  transpilePackages: ["@digi/db", "@digi/auth", "@digi/ui", "@digi/shared"],
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
};

export default config;
