import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  PROXMOX_API_URL: z.string().optional(),
  PROXMOX_TOKEN_ID: z.string().optional(),
  PROXMOX_TOKEN_SECRET: z.string().optional(),
  PROXMOX_TEMPLATE_ID: z.string().optional(),
  PLATFORM_DOMAIN: z.string().default("localhost"),
  MASTER_CADDY_URL: z.string().optional(),
  PORT: z
    .string()
    .transform(Number)
    .default("4000"),
});

export const env = process.env.SKIP_ENV_VALIDATION
  ? (process.env as unknown as z.infer<typeof envSchema>)
  : envSchema.parse(process.env);
