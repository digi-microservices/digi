import { defineConfig } from "drizzle-kit";
import { readFileSync } from "fs";

// Load DATABASE_URL from .env if not already set in environment.
// Searches ../../.env (monorepo root when CWD is packages/db/) then .env.
if (!process.env.DATABASE_URL) {
  for (const envPath of ["../../.env", ".env"]) {
    try {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^DATABASE_URL=(.+)$/);
        if (match) {
          process.env.DATABASE_URL = match[1]!.trim().replace(/^["']|["']$/g, "");
          break;
        }
      }
      if (process.env.DATABASE_URL) break;
    } catch {
      // File not found, try next path
    }
  }
}

export default defineConfig({
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
