#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
fail()    { echo -e "${RED}✗${NC} $1"; exit 1; }
step()    { echo -e "\n${BOLD}$1${NC}"; }

# Navigate to repo root
cd "$(dirname "$0")/.."

step "Digi Dev Setup"
echo ""

# ── Prerequisites ──────────────────────────────────────────

step "Checking prerequisites..."

command -v docker >/dev/null 2>&1 || fail "Docker is not installed. Install it from https://docs.docker.com/get-docker/"
success "Docker found"

command -v bun >/dev/null 2>&1 || fail "Bun is not installed. Install it from https://bun.sh"
success "Bun $(bun --version) found"

docker info >/dev/null 2>&1 || fail "Docker daemon is not running. Start Docker Desktop or the Docker service."
success "Docker daemon running"

# ── Environment ────────────────────────────────────────────

step "Checking environment..."

if [ ! -f .env ]; then
  cp .env.example .env
  success "Created .env from .env.example"
else
  success ".env exists"
fi

# ── Infrastructure ─────────────────────────────────────────

step "Starting infrastructure..."

docker compose up -d
echo ""

# Wait for PostgreSQL
echo -n "  Waiting for PostgreSQL"
RETRIES=0
MAX_RETRIES=30
until docker compose exec -T postgres pg_isready -U digi -q 2>/dev/null; do
  echo -n "."
  sleep 1
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo ""
    fail "PostgreSQL failed to start after ${MAX_RETRIES}s"
  fi
done
echo ""
success "PostgreSQL ready"

# Wait for Redis
echo -n "  Waiting for Redis"
RETRIES=0
until docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; do
  echo -n "."
  sleep 1
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo ""
    fail "Redis failed to start after ${MAX_RETRIES}s"
  fi
done
echo ""
success "Redis ready"

# Wait for Caddy
echo -n "  Waiting for Caddy"
RETRIES=0
until curl -sf http://localhost:2019/config/ >/dev/null 2>&1; do
  echo -n "."
  sleep 1
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo ""
    warn "Caddy admin API not responding (non-critical, continuing)"
    break
  fi
done
if [ $RETRIES -lt $MAX_RETRIES ]; then
  echo ""
  success "Caddy ready"
fi

# ── Dependencies ───────────────────────────────────────────

step "Installing dependencies..."

bun install
success "Dependencies installed"

# ── Database ───────────────────────────────────────────────

step "Setting up database..."

cd packages/db
bun run db:push 2>&1 | tail -1
cd ../..
success "Database schema pushed"

# ── Summary ────────────────────────────────────────────────

step "Setup complete!"
echo ""
echo -e "  ${BOLD}Services:${NC}"
echo -e "    PostgreSQL    ${DIM}localhost:5432${NC}"
echo -e "    Redis         ${DIM}localhost:6379${NC}"
echo -e "    Caddy         ${DIM}localhost:80${NC}   ${DIM}(admin: :2019)${NC}"
echo -e "    Mailpit       ${DIM}localhost:8025${NC}"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "    ${BLUE}bun run seed:admin${NC}    Create admin user"
echo -e "    ${BLUE}bun dev${NC}               Start all apps"
echo ""
echo -e "  ${BOLD}Access via Caddy:${NC}"
echo -e "    Landing       ${DIM}http://localhost${NC}"
echo -e "    API           ${DIM}http://api.localhost${NC}"
echo -e "    Dashboard     ${DIM}http://app.localhost${NC}"
echo -e "    Admin         ${DIM}http://admin.localhost${NC}"
echo -e "    Mailpit       ${DIM}http://mail.localhost${NC}"
echo ""
