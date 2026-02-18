// Caddy admin API client for managing reverse proxy routes.
// Both the Master Caddy and VM-level Caddy instances expose
// the Caddy admin API (default port 2019).

export interface CaddyRoute {
  subdomain: string;
  upstreamHost: string;
  upstreamPort: number;
}

async function caddyRequest(
  caddyUrl: string,
  path: string,
  options: RequestInit = {}
) {
  const url = `${caddyUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Caddy API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

export async function addRoute(
  caddyUrl: string,
  route: CaddyRoute
): Promise<void> {
  const config = {
    "@id": `route-${route.subdomain}`,
    match: [{ host: [route.subdomain] }],
    handle: [
      {
        handler: "reverse_proxy",
        upstreams: [
          { dial: `${route.upstreamHost}:${route.upstreamPort}` },
        ],
      },
    ],
  };

  await caddyRequest(caddyUrl, "/config/apps/http/servers/srv0/routes", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function removeRoute(
  caddyUrl: string,
  subdomain: string
): Promise<void> {
  await caddyRequest(caddyUrl, `/id/route-${subdomain}`, {
    method: "DELETE",
  });
}

export async function getConfig(caddyUrl: string): Promise<unknown> {
  return caddyRequest(caddyUrl, "/config/");
}

// Add a route on the Master Caddy to forward traffic for a subdomain to a VM
export async function addMasterRoute(
  masterCaddyUrl: string,
  subdomain: string,
  vmIp: string,
  vmCaddyPort: number = 80
): Promise<void> {
  await addRoute(masterCaddyUrl, {
    subdomain,
    upstreamHost: vmIp,
    upstreamPort: vmCaddyPort,
  });
}

// Add a route on a VM-level Caddy to forward traffic to a local container
export async function addVmRoute(
  vmCaddyUrl: string,
  subdomain: string,
  containerPort: number
): Promise<void> {
  await addRoute(vmCaddyUrl, {
    subdomain,
    upstreamHost: "127.0.0.1",
    upstreamPort: containerPort,
  });
}
