import { env } from "../env";

const CF_API = "https://api.cloudflare.com/client/v4";

async function cfRequest(path: string, options: RequestInit = {}) {
  if (!env.CLOUDFLARE_API_TOKEN) {
    throw new Error("Cloudflare API token not configured");
  }

  const response = await fetch(`${CF_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

export async function createDnsRecord(
  zoneId: string,
  type: string,
  name: string,
  content: string,
  proxied: boolean = true,
): Promise<string> {
  const result = await cfRequest(`/zones/${zoneId}/dns_records`, {
    method: "POST",
    body: JSON.stringify({ type, name, content, proxied }),
  });
  return result.result.id;
}

export async function deleteDnsRecord(
  zoneId: string,
  recordId: string,
): Promise<void> {
  await cfRequest(`/zones/${zoneId}/dns_records/${recordId}`, {
    method: "DELETE",
  });
}

export async function listDnsRecords(
  zoneId: string,
  name?: string,
): Promise<Array<{ id: string; type: string; name: string; content: string }>> {
  const params = name ? `?name=${name}` : "";
  const result = await cfRequest(`/zones/${zoneId}/dns_records${params}`);
  return result.result;
}

export async function verifyDomainOwnership(
  zoneId: string,
  domain: string,
  verificationToken: string,
): Promise<boolean> {
  const records = await listDnsRecords(zoneId, `_digi-verify.${domain}`);
  return records.some(
    (r) => r.type === "TXT" && r.content === verificationToken,
  );
}
