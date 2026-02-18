import { env } from "../env.js";

interface ProxmoxConfig {
  apiUrl: string;
  tokenId: string;
  tokenSecret: string;
}

function getConfig(): ProxmoxConfig {
  if (!env.PROXMOX_API_URL || !env.PROXMOX_TOKEN_ID || !env.PROXMOX_TOKEN_SECRET) {
    throw new Error("Proxmox is not configured");
  }
  return {
    apiUrl: env.PROXMOX_API_URL,
    tokenId: env.PROXMOX_TOKEN_ID,
    tokenSecret: env.PROXMOX_TOKEN_SECRET,
  };
}

async function proxmoxRequest(path: string, options: RequestInit = {}) {
  const config = getConfig();
  const url = `${config.apiUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `PVEAPIToken=${config.tokenId}=${config.tokenSecret}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Proxmox API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

export async function cloneTemplate(
  node: string,
  templateId: number,
  newVmId: number,
  name: string
): Promise<void> {
  await proxmoxRequest(`/nodes/${node}/qemu/${templateId}/clone`, {
    method: "POST",
    body: JSON.stringify({
      newid: newVmId,
      name,
      full: true,
    }),
  });
}

export async function startVm(node: string, vmId: number): Promise<void> {
  await proxmoxRequest(`/nodes/${node}/qemu/${vmId}/status/start`, {
    method: "POST",
  });
}

export async function stopVm(node: string, vmId: number): Promise<void> {
  await proxmoxRequest(`/nodes/${node}/qemu/${vmId}/status/stop`, {
    method: "POST",
  });
}

export async function deleteVm(node: string, vmId: number): Promise<void> {
  await proxmoxRequest(`/nodes/${node}/qemu/${vmId}`, {
    method: "DELETE",
  });
}

export async function getVmStatus(
  node: string,
  vmId: number
): Promise<{ status: string; cpu: number; mem: number; maxmem: number }> {
  const result = await proxmoxRequest(
    `/nodes/${node}/qemu/${vmId}/status/current`
  );
  return result.data;
}

export async function configureVm(
  node: string,
  vmId: number,
  config: { cores?: number; memory?: number; net0?: string }
): Promise<void> {
  await proxmoxRequest(`/nodes/${node}/qemu/${vmId}/config`, {
    method: "PUT",
    body: JSON.stringify(config),
  });
}
