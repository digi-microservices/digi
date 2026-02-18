# Production Setup

Complete guide for deploying Digi in production.

## Overview

A production Digi deployment consists of:
1. **PostgreSQL** — Primary database
2. **Redis** — Cache, pub/sub, job queue
3. **Master Caddy** — Reverse proxy with wildcard SSL
4. **API server** — GraphQL API + job worker
5. **Dashboard** — User-facing Next.js app
6. **Admin** — Admin Next.js app
7. **Proxmox VE** — VM provisioning (existing infrastructure)

## 1. Database & Redis

### PostgreSQL 16

Use a managed service (e.g., Supabase, Neon, AWS RDS) or self-host:

```bash
# Self-hosted example
docker run -d \
  --name digi-postgres \
  -e POSTGRES_USER=digi \
  -e POSTGRES_PASSWORD=<strong-password> \
  -e POSTGRES_DB=digi \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

Set `DATABASE_URL`:
```
DATABASE_URL=postgresql://digi:<password>@<host>:5432/digi
```

### Redis 7

```bash
docker run -d \
  --name digi-redis \
  -p 6379:6379 \
  -v redisdata:/data \
  redis:7-alpine redis-server --requirepass <password>
```

Set `REDIS_URL`:
```
REDIS_URL=redis://:<password>@<host>:6379
```

## 2. Master Caddy Setup

See [Caddy Configuration](./caddy-config.md) for the full Caddyfile and setup.

Install Caddy on a public-facing server with ports 80 and 443 open:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

Caddy must be built with the Cloudflare DNS plugin for wildcard certificates. See [caddy-config.md](./caddy-config.md).

## 3. Cloudflare Setup

See [Cloudflare Setup](./cloudflare-setup.md) for detailed instructions.

Summary:
1. Create API token with `Zone:DNS:Edit` and `Zone:Zone:Read` permissions
2. Add wildcard DNS record: `*.yourdomain.tld` → master Caddy server IP
3. Note the Zone ID from your domain's overview page

## 4. Proxmox Setup

### Create API token

1. Open Proxmox web UI → Datacenter → Permissions → API Tokens
2. Create token for a user with VM management permissions
3. Note the Token ID (e.g., `user@pam!digi`) and secret

### Prepare VM template

Create an Ubuntu 22.04 VM template with Docker and Caddy pre-installed:

```bash
# On the template VM:
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Caddy
sudo apt install -y caddy

# Clean up and convert to template
sudo apt clean && sudo rm -rf /tmp/*
# Then convert to template via Proxmox UI
```

Note the template VM ID (e.g., `9000`).

## 5. Environment Variables

Create `.env` on your production server with all required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://digi:pass@db:5432/digi` |
| `REDIS_URL` | Redis connection string | `redis://:pass@redis:6379` |
| `BETTER_AUTH_SECRET` | Auth signing secret (random 32+ chars) | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | API URL for auth callbacks | `https://api.yourdomain.tld` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret | |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PRO_PRICE_ID` | Stripe price ID for pro plan | `price_...` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID | |
| `PROXMOX_API_URL` | Proxmox API endpoint | `https://proxmox:8006/api2/json` |
| `PROXMOX_TOKEN_ID` | Proxmox API token ID | `user@pam!digi` |
| `PROXMOX_TOKEN_SECRET` | Proxmox API token secret | |
| `PROXMOX_TEMPLATE_ID` | VM template ID | `9000` |
| `PLATFORM_DOMAIN` | Your platform domain | `yourdomain.tld` |
| `MASTER_CADDY_URL` | Master Caddy admin API | `http://caddy:2019` |

## 6. Build & Deploy

### Build all apps

```bash
bun install
bun build
```

### Deploy as systemd services

**API** (`/etc/systemd/system/digi-api.service`):

```ini
[Unit]
Description=Digi API
After=network.target

[Service]
Type=simple
User=digi
WorkingDirectory=/opt/digi
ExecStart=/usr/local/bin/bun run apps/api/dist/index.js
EnvironmentFile=/opt/digi/.env
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Dashboard** (`/etc/systemd/system/digi-dashboard.service`):

```ini
[Unit]
Description=Digi Dashboard
After=network.target

[Service]
Type=simple
User=digi
WorkingDirectory=/opt/digi/apps/dashboard
ExecStart=/usr/local/bin/bun run start
EnvironmentFile=/opt/digi/.env
Environment=PORT=3001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Admin** (`/etc/systemd/system/digi-admin.service`):

```ini
[Unit]
Description=Digi Admin
After=network.target

[Service]
Type=simple
User=digi
WorkingDirectory=/opt/digi/apps/admin
ExecStart=/usr/local/bin/bun run start
EnvironmentFile=/opt/digi/.env
Environment=PORT=3002
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable digi-api digi-dashboard digi-admin
sudo systemctl start digi-api digi-dashboard digi-admin
```

## 7. Post-Deploy

### Push database schema

```bash
cd /opt/digi && bun run --filter @digi/db db:push
```

### Create admin user

```bash
cd /opt/digi && bun run --filter @digi/api seed:admin
```

### Add platform domain

1. Log into the admin dashboard at `https://admin.yourdomain.tld`
2. Go to Settings → Domains → Add your platform domain

### Add Proxmox nodes

1. In the admin dashboard, go to Infrastructure → Nodes
2. Add your Proxmox server with the API credentials configured above
