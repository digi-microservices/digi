# Digi Documentation

Digi is a self-hosted PaaS (Platform as a Service) that deploys apps from GitHub repos or Docker images onto Proxmox VMs with automatic subdomain routing, SSL, and billing.

## Guides

- **[Getting Started](./getting-started.md)** — Local development setup
- **[Production Setup](./production-setup.md)** — Full production deployment
- **[Caddy Configuration](./caddy-config.md)** — Master Caddy reverse proxy setup
- **[Cloudflare Setup](./cloudflare-setup.md)** — DNS and API token configuration
- **[CLI Guide](./cli-guide.md)** — Command-line interface usage

## Quick Links

| App | Port | Description |
|-----|------|-------------|
| API | 4000 | GraphQL API (ElysiaJS + GraphQL Yoga) |
| Dashboard | 3001 | User dashboard (Next.js 15) |
| Admin | 3002 | Admin dashboard (Next.js 15) |
| Landing | 3000 | Landing page (Next.js 15) |

## Architecture

```
User → Cloudflare DNS → Master Caddy → VM Caddy → Docker Container
                              ↓
                         API Server → PostgreSQL / Redis
                              ↓
                     Proxmox VE (VM management)
```
