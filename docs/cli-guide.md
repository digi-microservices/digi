# CLI Guide

The Digi CLI (`digi`) manages services, deployments, and configuration from your terminal.

## Installation

### Build from source

```bash
cd packages/cli
bun run build
```

This creates a standalone binary at `packages/cli/dist/digi`. Add it to your PATH:

```bash
sudo cp packages/cli/dist/digi /usr/local/bin/digi
```

### Run directly with Bun

```bash
cd packages/cli
bun run src/index.ts
```

## Authentication

### Browser login (recommended)

```bash
digi login
```

Select "Browser login" — your browser opens to authorize the CLI. The token is saved automatically.

### API token login

```bash
digi login
```

Select "API token" and provide your API URL and token. You can generate API tokens from the dashboard Settings page.

### Check current user

```bash
digi whoami
```

### Log out

```bash
digi logout
```

## Project Setup

### Initialize a project

```bash
digi init my-api
```

Creates a `digi.toml` configuration file in the current directory.

### digi.toml reference

```toml
# Service definition
[my-api]
source_type = "github"
repo_url = "https://github.com/user/repo"
branch = "main"
port = "3000"

# Database service
[postgres]
type = "postgres"

# Redis service
[redis]
type = "redis"
```

Each `[section]` defines a service component. Supported fields:

| Field | Description | Default |
|-------|-------------|---------|
| `source_type` | `github` or `docker` | `github` |
| `repo_url` | GitHub repository URL | — |
| `docker_image` | Docker image name | — |
| `branch` | Git branch to deploy | `main` |
| `port` | Application port | `3000` |
| `type` | Component type (`postgres`, `redis`) | — |

## Service Management

### Create a service

```bash
digi services create
```

Interactive wizard that guides you through:
1. Service name
2. Source type (GitHub or Docker)
3. Repository/image details
4. Components (PostgreSQL, Redis)

### List services

```bash
digi services list
```

### View service details

```bash
digi services info <service-id>
```

### Delete a service

```bash
digi services delete <service-id>
```

## Deployment

### Deploy from digi.toml

```bash
digi deploy
```

Deploys all services defined in `digi.toml`.

### Deploy specific components

```bash
digi deploy --only app,postgres
```

## Logs

### Stream all logs

```bash
digi logs <service-id>
```

### Stream specific container

```bash
digi logs <service-id> app
```

## Environment Variables

### List variables

```bash
digi env list <service-id>
```

### Set variables

```bash
digi env set <service-id> DATABASE_URL=postgres://... REDIS_URL=redis://...
```

## Custom Domains

### List domains

```bash
digi domains list
```

### Add a custom domain

```bash
digi domains add <service-id> mycustomdomain.com
```

## Platform Health

```bash
digi status
```

Shows API connectivity, database status, and Redis status.
