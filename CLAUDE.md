# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Digi is a self-hosted PaaS (Platform as a Service) similar to Railway/Render, built as a Turborepo monorepo. It deploys apps from GitHub repos or Docker images onto Proxmox VMs with automatic subdomain routing, SSL, and billing.

## Monorepo Structure

```
digi/
├── apps/
│   ├── web/            # Landing page (Next.js 15) — port 3000
│   ├── api/            # GraphQL API (ElysiaJS + GraphQL Yoga) — port 4000
│   ├── dashboard/      # User dashboard (Next.js 15) — port 3001
│   └── admin/          # Admin dashboard (Next.js 15) — port 3002
├── packages/
│   ├── cli/            # CLI binary (Bun standalone) — `digi` command
│   ├── db/             # Drizzle ORM schema & client (PostgreSQL)
│   ├── auth/           # better-auth configuration (shared across apps)
│   ├── redis/          # Redis client, cache, pub/sub, job queue
│   ├── shared/         # Shared types & utilities
│   ├── ui/             # React component library
│   ├── eslint-config/  # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript config
├── docker-compose.yml  # Local dev (PostgreSQL, Redis, Mailpit)
├── turbo.json
└── package.json
```

## Development Commands

```bash
# Start everything
bun dev                  # Starts all apps via Turborepo

# Infrastructure
docker compose up -d     # Start PostgreSQL, Redis, Mailpit

# Database
cd packages/db && bun run db:push    # Push schema to DB
cd apps/api && bun run seed:admin    # Create admin user

# CLI
cd packages/cli && bun run build     # Build CLI binary

# Type checking & Linting
bun typecheck            # Type check all packages
bun lint                 # Run ESLint
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| API | ElysiaJS + GraphQL Yoga |
| Frontend | Next.js 15, React 19, Tailwind CSS v4 |
| Auth | better-auth (shared across all apps) |
| Database | PostgreSQL + Drizzle ORM |
| Cache/Queue | Redis (ioredis) + DB-backed job queue |
| Virtualisation | Proxmox VE REST API |
| Containers | Docker (inside VMs) |
| Routing | Caddy (master + per-VM) |
| DNS | Cloudflare API |
| Billing | Stripe |
| Builds | Railpack (buildpacks) + Docker images |
| CLI | Bun standalone binary |

## Architecture

### Environment Variables

- Managed via `@t3-oss/env-nextjs` with Zod validation in each app's `src/env.ts` (or `src/env.js` for web)
- Server vars go in the `server` schema, client vars (prefixed with `NEXT_PUBLIC_`) go in the `client` schema
- Set `SKIP_ENV_VALIDATION=1` to skip validation (useful for Docker builds)
- See `.env.example` for all required variables

### Path Aliases

- `~/*` maps to `./src/*` in all apps (configured in tsconfig.json)
- Use workspace imports for shared packages: `import { createDb } from "@digi/db"`

### Database (`packages/db`)

- Drizzle ORM with PostgreSQL (postgres-js driver)
- ~20 tables: users, sessions, accounts, servers, vms, services, containers, deployments, plans, subscriptions, coupons, api-tokens, audit-logs, jobs, etc.
- Schema in `packages/db/src/schema/`
- Relations in `packages/db/src/schema/relations.ts`

### Auth (`packages/auth`)

- better-auth with credentials + GitHub OAuth
- Shared between API and dashboard apps
- User roles: "user" | "admin"
- JWT sessions backed by Redis

### Redis (`packages/redis`)

- Cache with typed keys and TTLs
- Pub/sub for log streaming and deployment events
- DB-backed job queue (replaces BullMQ for Bun compatibility)

### API (`apps/api`)

- ElysiaJS with GraphQL Yoga at `/graphql`
- WebSocket subscriptions for containerLogs and deploymentStatus
- Stripe webhook at `/webhooks/stripe`
- Service layer in `src/services/` (proxmox, docker, caddy, cloudflare, stripe, deployment, vm)
- Job queue worker processes deployments and teardowns

### Styling

- Tailwind CSS v4 with PostCSS
- Dark theme with blue accents (`#3A7DFF`)
- Custom fonts: Cal Sans and Geist

## TypeScript Configuration

- Strict mode enabled with `noUncheckedIndexedAccess`
- ES2022 target with ESNext modules
- Base config in `packages/typescript-config/base.json`

## Code Style

- ESLint with Next.js config + TypeScript strict rules
- Prettier with Tailwind CSS plugin for class sorting
- Prefer `type` imports with inline style: `import { type Foo } from "..."`
- Unused vars prefixed with `_` are allowed
