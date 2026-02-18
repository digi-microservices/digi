# Caddy Configuration

Digi uses Caddy as a reverse proxy on two levels:
1. **Master Caddy** — Runs on the public-facing server, handles wildcard SSL and routes to the API, dashboards, and user VMs
2. **Per-VM Caddy** — Runs inside each provisioned VM, routes to Docker containers

## Master Caddy

### Build with Cloudflare DNS plugin

Wildcard certificates require DNS challenge validation. Build Caddy with the Cloudflare plugin:

```bash
# Using xcaddy
go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
xcaddy build --with github.com/caddy-dns/cloudflare
sudo mv caddy /usr/bin/caddy
```

### Caddyfile

```caddyfile
{
  # Enable admin API for dynamic route management
  admin :2019

  # Wildcard certificate via Cloudflare DNS challenge
  acme_dns cloudflare {env.CLOUDFLARE_API_TOKEN}
}

# API server
api.{$PLATFORM_DOMAIN} {
  reverse_proxy localhost:4000
}

# User dashboard
app.{$PLATFORM_DOMAIN} {
  reverse_proxy localhost:3001
}

# Admin dashboard
admin.{$PLATFORM_DOMAIN} {
  reverse_proxy localhost:3002
}

# Landing page
{$PLATFORM_DOMAIN} {
  reverse_proxy localhost:3000
}

# Dynamic VM routing is managed via the Caddy admin API
# Digi's caddy.service.ts adds/removes routes at runtime
```

### Environment variables

Set these for Caddy:

```bash
export CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
export PLATFORM_DOMAIN=yourdomain.tld
```

### Systemd service

```ini
[Unit]
Description=Caddy
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile
TimeoutStopSec=5s
LimitNOFILE=1048576
EnvironmentFile=/etc/caddy/env

[Install]
WantedBy=multi-user.target
```

## Dynamic Route Management

Digi's `caddy.service.ts` uses the Caddy admin API to dynamically add routes when services are deployed.

### How it works

When a service gets a subdomain (e.g., `my-app-abc123`), the API calls Caddy's admin endpoint:

```bash
# Add a route for a service
curl -X POST http://localhost:2019/config/apps/http/servers/srv0/routes \
  -H "Content-Type: application/json" \
  -d '{
    "@id": "service-abc123",
    "match": [{"host": ["my-app-abc123.yourdomain.tld"]}],
    "handle": [{
      "handler": "reverse_proxy",
      "upstreams": [{"dial": "<vm-ip>:80"}]
    }]
  }'
```

```bash
# Remove a route
curl -X DELETE http://localhost:2019/id/service-abc123
```

### View current config

```bash
curl http://localhost:2019/config/ | jq
```

## Per-VM Caddy

Each VM runs a Caddy instance that routes incoming traffic to Docker containers:

```caddyfile
:80 {
  reverse_proxy localhost:3000
}
```

This is automatically configured by Digi when containers are deployed to a VM. The master Caddy routes `*.yourdomain.tld` to the VM's IP, and the VM's Caddy routes to the container port.
