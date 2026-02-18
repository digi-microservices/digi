# Digi — Self-Hosted PaaS Platform

A self-hosted Platform as a Service (PaaS) similar to Railway/Render, built as a Turborepo monorepo. Deploy apps from GitHub repos or Docker images onto Proxmox VMs with automatic subdomain routing, SSL, and billing.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare DNS                     │
│              *.domain.tld → Master Caddy IP          │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Master Caddy (public entry)              │
│         Routes subdomains → VM-level Caddy           │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Proxmox VE Cluster                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Master VM   │  │  Master VM   │  │  Master VM   │  │
│  │  VM Caddy    │  │  VM Caddy    │  │  VM Caddy    │  │
│  │  Docker      │  │  Docker      │  │  Docker      │  │
│  │  ┌─────────┐ │  │  ┌─────────┐ │  │             │  │
│  │  │ app     │ │  │  │ app     │ │  │  ...        │  │
│  │  │ postgres│ │  │  │ redis   │ │  │             │  │
│  │  │ redis   │ │  │  └─────────┘ │  │             │  │
│  │  └─────────┘ │  └─────────────┘  └─────────────┘  │
│  └─────────────┘                                     │
└─────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
digi/
├── apps/
│   ├── web/            # Landing page (Next.js 15)
│   ├── api/            # GraphQL API (ElysiaJS + GraphQL Yoga)
│   ├── dashboard/      # User dashboard (Next.js 15)
│   └── admin/          # Admin dashboard (Next.js 15)
├── packages/
│   ├── cli/            # CLI binary (Bun standalone)
│   ├── db/             # Drizzle ORM schema & client
│   ├── auth/           # better-auth configuration
│   ├── redis/          # Redis client, cache, pub/sub, job queue
│   ├── shared/         # Shared types & utilities
│   ├── ui/             # React component library
│   ├── eslint-config/  # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript config
├── docker-compose.yml  # Local dev (PostgreSQL, Redis, Mailpit)
├── turbo.json
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| API | ElysiaJS + GraphQL Yoga |
| Frontend | Next.js 15, React 19, Tailwind CSS v4 |
| Auth | better-auth (shared across all apps) |
| Database | PostgreSQL + Drizzle ORM |
| Cache/Queue | Redis (ioredis) |
| Virtualisation | Proxmox VE REST API |
| Containers | Docker (inside VMs) |
| Routing | Caddy (master + per-VM) |
| DNS | Cloudflare API |
| Billing | Stripe |
| Builds | Railpack (buildpacks) + Docker images |
| CLI | Bun standalone binary |

## Local Development Setup

### Prerequisites

- [Bun](https://bun.sh) v1.3.3+
- [Docker](https://docker.com) (for PostgreSQL and Redis)

### Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> digi && cd digi

# 2. Install dependencies
bun install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# 5. Push database schema
cd packages/db && bun run db:push && cd ../..

# 6. Seed admin user
cd apps/api && bun run seed:admin && cd ../..

# 7. Start all services
bun dev
```

### Dev Server Ports

| Service | URL |
|---------|-----|
| Landing page | http://localhost:3000 |
| User dashboard | http://localhost:3001 |
| Admin dashboard | http://localhost:3002 |
| GraphQL API | http://localhost:4000 |
| GraphQL Playground | http://localhost:4000/graphql |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| Mailpit UI | http://localhost:8025 |

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://digi:digi_dev@localhost:5432/digi

# Redis
REDIS_URL=redis://localhost:6379

# Auth (better-auth)
BETTER_AUTH_SECRET=<random-secret>     # Required, min 32 chars
BETTER_AUTH_URL=http://localhost:4000   # API base URL

# GitHub OAuth (optional, for repo linking)
GITHUB_CLIENT_ID=<github-oauth-app-id>
GITHUB_CLIENT_SECRET=<github-oauth-app-secret>

# Stripe (optional for local dev)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

# Cloudflare (required for DNS management)
CLOUDFLARE_API_TOKEN=<api-token>
CLOUDFLARE_ZONE_ID=<zone-id>

# Proxmox (required for VM provisioning)
PROXMOX_API_URL=https://proxmox.example.com:8006/api2/json
PROXMOX_TOKEN_ID=user@pam!tokenname
PROXMOX_TOKEN_SECRET=<token-secret>
PROXMOX_TEMPLATE_ID=100

# Platform
PLATFORM_DOMAIN=digi.example.com
MASTER_CADDY_URL=http://caddy-master:2019
```

## Admin Access

Admin accounts cannot be created via the UI. Use the seed script:

```bash
# Create admin with default email
bun run seed:admin

# Create admin with custom email
bun run seed:admin admin@example.com "Admin Name"
```

The initial password is printed to stdout. **Save it immediately** — admin passwords rotate every 24 hours. After rotation, check API server logs for the new password.

## CLI Usage

The CLI binary is called `digi`. Build it with:

```bash
cd packages/cli && bun run build
```

### Authentication

```bash
digi login           # Authenticate with API token
digi logout          # Clear saved credentials
digi whoami          # Show current user
```

### Service Management

```bash
digi services list              # List all services
digi services create            # Interactive service creation
digi services info <id>         # Service details
digi services delete <id>       # Delete service
```

### Deployment

```bash
digi deploy                     # Deploy all services from digi.toml
digi deploy --only postgres     # Deploy specific components
digi deploy --only app,redis    # Deploy multiple components
```

### Live Logs

```bash
digi logs <serviceId>                  # Stream all logs
digi logs <serviceId> <containerName>  # Stream specific container
```

### Environment Variables

```bash
digi env list <serviceId>              # List env vars
digi env set <serviceId> KEY=VALUE     # Set env vars
```

### Domains

```bash
digi domains list                      # List platform domains
digi domains add <serviceId> <domain>  # Add custom domain (Pro)
```

### Platform Status

```bash
digi status                            # Check API health
```

### digi.toml Configuration

```toml
name = "my-app"

[services.app]
type = "github"
repo = "https://github.com/user/repo"
branch = "main"

[services.app.env]
NODE_ENV = "production"

[services.postgres]
type = "postgres"

[services.redis]
type = "redis"

[services.worker]
type = "docker"
image = "myregistry/worker:latest"

[services.worker.env]
QUEUE_URL = "redis://redis:6379"
```

## Billing Tiers

| Plan | Storage | Price | Custom Domains |
|------|---------|-------|----------------|
| Free | 16 GB/VM | Free | No |
| Pro | 64 GB/VM | Paid | Yes |

Pro users can upgrade storage in 32 GB increments at £5/month each.

## Subdomain Format

Services get auto-assigned subdomains:

- Primary app: `app-name-random12.domain.tld`
- PostgreSQL: `app-name-random12-postgres-a3f2.domain.tld`
- Redis: `app-name-random12-redis-b91c.domain.tld`

## Production Deployment

### Prerequisites

1. Proxmox VE cluster with API access
2. Cloudflare account with API token and domain
3. Stripe account for billing
4. Ubuntu LTS VM template in Proxmox (Docker + Caddy pre-installed)
5. Master Caddy instance with wildcard SSL

### Steps

1. Deploy PostgreSQL and Redis (managed or self-hosted)
2. Set all environment variables
3. Run `bun run db:push` to create tables
4. Run `bun run seed:admin` to create admin account
5. Build and deploy the API: `cd apps/api && bun run build && bun run start`
6. Build and deploy dashboards: `cd apps/dashboard && bun run build && bun run start`
7. Configure Master Caddy to route:
   - `api.domain.tld` → API server
   - `app.domain.tld` → User dashboard
   - `admin.domain.tld` → Admin dashboard
   - `*.domain.tld` → Dynamic routing to VMs
8. Add platform domain via admin dashboard
9. Add Proxmox nodes via admin dashboard

## GraphQL API

The API is available at `/graphql` with a playground in development.

### Key Operations

**Queries**: `me`, `services`, `service(id)`, `servers` (admin), `domains`, `vmStats(vmId)` (admin), `auditLogs` (admin), `users` (admin), `coupons` (admin)

**Mutations**: `createService`, `deleteService`, `updateService`, `deployService`, `stopContainer`, `restartContainer`, `setEnvVars`, `addProxmoxNode`, `removeProxmoxNode`, `addDomain`, `removeDomain`, `setDomainDefault`, `createCheckoutSession`, `upgradeStorage`, `createCoupon`, `deactivateCoupon`, `deleteCoupon`, `applyCoupon`, `suspendUser`, `unsuspendUser`, `deleteUser`, `generateApiToken`, `revokeApiToken`

**Subscriptions (WebSocket)**: `containerLogs(serviceId, containerId)`, `deploymentStatus(jobId)`

## License

Private — All rights reserved.
