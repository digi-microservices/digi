# Cloudflare Setup

Digi uses Cloudflare for DNS management and wildcard SSL certificates.

## 1. Create API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → My Profile → API Tokens
2. Click "Create Token"
3. Use "Custom token" template
4. Set permissions:
   - **Zone → DNS → Edit** — Required for creating/deleting DNS records
   - **Zone → Zone → Read** — Required for listing zones
5. Set zone resources:
   - **Include → Specific zone → yourdomain.tld**
6. Create the token and save it securely

Set as environment variable:
```bash
CLOUDFLARE_API_TOKEN=your-token-here
```

## 2. Find Zone ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain
3. On the Overview page, scroll down to the right sidebar
4. Copy the **Zone ID**

Set as environment variable:
```bash
CLOUDFLARE_ZONE_ID=your-zone-id-here
```

## 3. Add Wildcard DNS Record

1. Go to your domain → DNS → Records
2. Add a new record:
   - **Type:** A
   - **Name:** `*` (wildcard)
   - **Content:** Your master Caddy server's public IP
   - **Proxy status:** DNS only (gray cloud) — important for wildcard SSL to work with Caddy
   - **TTL:** Auto

Also add a root record:
   - **Type:** A
   - **Name:** `@`
   - **Content:** Same server IP
   - **Proxy status:** DNS only

## 4. How Digi Manages DNS

Digi's `cloudflare.service.ts` programmatically manages DNS records via the Cloudflare API:

### Creating a service subdomain

When a service is created, Digi:
1. Generates a unique subdomain (e.g., `my-app-abc123`)
2. Creates an A record pointing `my-app-abc123.yourdomain.tld` to the VM's IP
3. Updates the master Caddy config to route traffic

### Custom domains

When a user adds a custom domain:
1. A CNAME record is created pointing their domain to `my-app-abc123.yourdomain.tld`
2. Caddy automatically obtains an SSL certificate for the custom domain

### Cleanup

When a service is deleted:
1. DNS records are removed via the Cloudflare API
2. Caddy routes are removed via the admin API

## Verifying Setup

Test that the API token works:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" | jq '.success'
```

Should return `true`.
