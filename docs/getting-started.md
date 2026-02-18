# Getting Started

Local development setup for the Digi monorepo.

## Prerequisites

- **[Bun](https://bun.sh)** v1.3+ — JavaScript runtime and package manager
- **[Docker](https://docs.docker.com/get-docker/)** — For PostgreSQL, Redis, Caddy, and Mailpit

## Quick Setup

Run the automated setup script:

```bash
git clone https://github.com/your-org/digi.git
cd digi
./scripts/dev-setup.sh
```

This will:
1. Check prerequisites (Docker, Bun)
2. Create `.env` from `.env.example` if needed
3. Start PostgreSQL, Redis, Caddy, and Mailpit via Docker
4. Wait for services to be healthy
5. Install dependencies
6. Push the database schema

After setup, create an admin user and start dev:

```bash
bun run seed:admin
bun dev
```

## Manual Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/digi.git
cd digi
bun install
```

### 2. Configure environment

```bash
cp .env.example .env
```

The defaults work with Docker Compose out of the box.

### 3. Start infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port 5432 (user: `digi`, password: `digi_dev`, db: `digi`)
- **Redis 7** on port 6379
- **Caddy** on port 80 (reverse proxy) and 2019 (admin API)
- **Mailpit** on port 1025 (SMTP) and 8025 (web UI)

### 4. Push database schema

```bash
bun run db:push
```

### 5. Create admin user

```bash
bun run seed:admin
```

### 6. Start development

```bash
bun dev
```

## Accessing Apps

With Caddy running, all apps are available on port 80 via subdomains:

| App | Via Caddy | Direct | Description |
|-----|-----------|--------|-------------|
| Landing | http://localhost | http://localhost:3000 | Landing page |
| API | http://api.localhost | http://localhost:4000 | GraphQL API |
| Dashboard | http://app.localhost | http://localhost:3001 | User dashboard |
| Admin | http://admin.localhost | http://localhost:3002 | Admin panel |
| Mailpit | http://mail.localhost | http://localhost:8025 | Email testing UI |
| GraphQL Playground | http://api.localhost/graphql | http://localhost:4000/graphql | API explorer |

> **Note:** `.localhost` subdomains resolve to `127.0.0.1` automatically in modern browsers — no `/etc/hosts` changes needed.

## Convenience Scripts

```bash
bun run dev:setup       # Full setup (infra + deps + db)
bun run dev:infra       # Start Docker services only
bun run dev:infra:stop  # Stop Docker services
bun run dev:infra:reset # Reset Docker services (wipes data)
bun run db:push         # Push schema changes
bun run db:studio       # Open Drizzle Studio (DB browser)
bun run seed:admin      # Create admin user
bun dev                 # Start all apps
bun build               # Build all apps
bun typecheck           # Type check all packages
bun lint                # Run ESLint
```

## Build CLI

```bash
cd packages/cli
bun run build           # Compile standalone binary to dist/digi
```

## Troubleshooting

### Port 80 already in use

If another service is using port 80 (e.g., Apache, nginx), stop it or access apps directly on their ports (3000, 3001, 3002, 4000).

### Port already in use (app ports)

Kill processes on the relevant port:

```bash
lsof -ti:3000 | xargs kill -9   # Landing
lsof -ti:3001 | xargs kill -9   # Dashboard
lsof -ti:4000 | xargs kill -9   # API
```

### Database connection issues

Ensure Docker containers are running:

```bash
docker compose ps
docker compose logs postgres
```

### Redis connection issues

```bash
docker compose logs redis
redis-cli ping   # Should return PONG
```

### Caddy not proxying

```bash
docker compose logs caddy
curl -s http://localhost:2019/config/ | head   # Check admin API
```
