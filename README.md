![Digi Banner](./assets/digi_banner.png)

# Digi — Microservice Infrastructure for the Modern Web

> Self-hosted PaaS: deploy apps from GitHub or Docker onto Proxmox VMs with automatic subdomain routing, SSL, and billing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun)](https://bun.sh)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://typescriptlang.org)

---

## What is Digi?

Digi is a fully **self-hosted Platform as a Service** that gives you Railway-like developer experience on your own infrastructure. Point it at a GitHub repository or Docker image, and Digi handles the rest: provisioning VMs on Proxmox, configuring Caddy for routing, issuing SSL certificates, managing DNS via Cloudflare, and billing your users with Stripe.

Digi is built as a Turborepo monorepo with a Bun runtime, Next.js 15 frontends, and an ElysiaJS + GraphQL Yoga API — all strictly typed end-to-end.

## Features

- **Git-push deploys** — Connect a GitHub repo; every push triggers a new deployment via Railpack buildpacks
- **Docker image support** — Deploy any public or private Docker image
- **Automatic SSL** — Caddy handles HTTPS for every service subdomain
- **Custom domains** — Attach your own domains with automatic DNS and SSL
- **Real-time logs** — Stream container logs via WebSocket subscriptions
- **CLI** — `digi login`, `digi deploy`, `digi logs` — full terminal workflow
- **TypeScript SDK** — `@digi/sdk` for programmatic access
- **Billing** — Stripe-powered plans, subscriptions, and usage
- **Admin dashboard** — Manage servers, VMs, users, coupons, and audit logs
- **Auth** — Email/password + GitHub OAuth via better-auth

## Architecture

```
                        ┌─────────────────────────────────────┐
                        │           Digi Platform             │
                        │                                     │
  Browser/CLI ──────▶  │  ┌──────────┐   ┌──────────────┐  │
                        │  │ Next.js  │   │  ElysiaJS +  │  │
                        │  │Dashboard │   │ GraphQL Yoga │  │
                        │  └──────────┘   └──────┬───────┘  │
                        │                        │           │
                        │              ┌─────────▼─────────┐ │
                        │              │    PostgreSQL      │ │
                        │              │    Redis           │ │
                        │              └─────────┬─────────┘ │
                        └────────────────────────┼───────────┘
                                                 │
                        ┌────────────────────────▼───────────┐
                        │         Proxmox VE Cluster         │
                        │                                    │
                        │  ┌──────┐  ┌──────┐  ┌──────┐    │
                        │  │ VM 1 │  │ VM 2 │  │ VM 3 │    │
                        │  │Caddy │  │Caddy │  │Caddy │    │
                        │  │Docker│  │Docker│  │Docker│    │
                        │  └──────┘  └──────┘  └──────┘    │
                        └────────────────────────────────────┘
                                        │
                              Cloudflare DNS + SSL
```

## Monorepo Structure

```
digi/
├── apps/
│   ├── landing/    # Marketing site (Next.js 15) — port 3000
│   ├── dashboard/  # User dashboard (Next.js 15) — port 3001
│   ├── admin/      # Admin dashboard (Next.js 15) — port 3002
│   └── api/        # GraphQL API (ElysiaJS) — port 4000
├── packages/
│   ├── cli/        # CLI binary (Bun standalone)
│   ├── sdk/        # TypeScript SDK
│   ├── db/         # Drizzle ORM schema & client
│   ├── auth/       # better-auth configuration
│   ├── redis/      # Redis client, cache, pub/sub, queue
│   ├── shared/     # Shared types & utilities
│   └── ui/         # React component library
└── docs/           # Mintlify documentation
```

## Quick Start (Local Dev)

### 1. Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- [Docker](https://docker.com)

### 2. Install & Configure

```bash
git clone https://github.com/digi-microservices/digi
cd digi
bun install
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, REDIS_URL, BETTER_AUTH_SECRET
```

### 3. Start Infrastructure

```bash
docker compose up -d   # PostgreSQL + Redis + Mailpit
```

### 4. Set Up Database

```bash
cd packages/db && bun run db:push && cd ../..
```

### 5. Seed Admin User

```bash
bun run seed:admin
# Prints: admin@digi.run / <generated-password>
```

### 6. Run Everything

```bash
bun dev
```

| App                | URL                           | Description              |
| ------------------ | ----------------------------- | ------------------------ |
| Landing            | http://localhost:3000         | Marketing site           |
| Dashboard          | http://localhost:3001         | User dashboard           |
| Admin              | http://localhost:3002         | Admin panel              |
| API                | http://localhost:4000         | GraphQL API              |
| GraphQL Playground | http://localhost:4000/graphql | Interactive API explorer |
| Mailpit            | http://localhost:8025         | Email testing            |

## SDK

```typescript
import { DigiClient } from "@digi/sdk";

const digi = new DigiClient({
  apiUrl: "https://api.digi.run",
  token: process.env.DIGI_API_TOKEN!,
});

// List services
const services = await digi.services.list();

// Deploy a service
const deployment = await digi.services.deploy(services[0].id);

// Manage environment variables
await digi.env.set(services[0].id, [{ key: "NODE_ENV", value: "production" }]);
```

## CLI

```bash
# Install (build from source)
cd packages/cli && bun run build

# Login
digi login

# Create and deploy a service
digi services create --name my-api --repo https://github.com/you/my-api
digi deploy my-api --follow

# Manage environment variables
digi env set my-api DATABASE_URL=postgres://...

# Stream logs
digi logs my-api --follow
```

## Tech Stack

| Layer          | Technology                            |
| -------------- | ------------------------------------- |
| Runtime        | Bun                                   |
| API            | ElysiaJS + GraphQL Yoga               |
| Frontend       | Next.js 15, React 19, Tailwind CSS v4 |
| Auth           | better-auth                           |
| Database       | PostgreSQL + Drizzle ORM              |
| Cache/Queue    | Redis (ioredis)                       |
| Virtualisation | Proxmox VE REST API                   |
| Containers     | Docker (inside VMs)                   |
| Routing        | Caddy                                 |
| DNS            | Cloudflare API                        |
| Billing        | Stripe                                |
| Builds         | Railpack buildpacks                   |
| CLI            | Bun standalone binary                 |

## Self-Hosting

For production deployment on your own infrastructure, see the [Self-Hosting Guide](docs/self-hosting/overview.mdx).

You'll need:

- Proxmox VE cluster
- Domain on Cloudflare
- PostgreSQL + Redis
- Stripe account (for billing)

## Documentation

To run docs locally:

```bash
cd docs
npx mintlify dev
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run `bun typecheck && bun lint`
5. Submit a pull request

## License

MIT © Digi
