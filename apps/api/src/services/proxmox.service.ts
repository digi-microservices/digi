import { env } from "../env";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

interface ProxmoxConfig {
  apiUrl: string;
  tokenId: string;
  tokenSecret: string;
}

function getConfig(): ProxmoxConfig {
  if (
    !env.PROXMOX_API_URL ||
    !env.PROXMOX_TOKEN_ID ||
    !env.PROXMOX_TOKEN_SECRET
  ) {
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
  return new Promise<any>((resolve, reject) => {
    const parsedUrl = new URL(url);
    const body = options.body as string | undefined;

    const contentType =
      (options.headers as Record<string, string>)?.["Content-Type"] ?? null;
    console.log({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 8006,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: {
        Authorization: `PVEAPIToken=${config.tokenId}=${config.tokenSecret}`,
        "Content-Type": contentType,
        ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
      },
    });
    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 8006,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || "GET",
        headers: {
          Authorization: `PVEAPIToken=${config.tokenId}=${config.tokenSecret}`,
          ...(body
            ? {
                "Content-Type": contentType ?? "application/json",
                "Content-Length": String(Buffer.byteLength(body)),
              }
            : {}),
          ...(contentType && !body ? { "Content-Type": contentType } : {}),
        },
        agent,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Proxmox API error: ${res.statusCode} ${data}`));
          } else {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          }
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function waitForTask(node: string, upid: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const result = await proxmoxRequest(
      `/nodes/${node}/tasks/${encodeURIComponent(upid)}/status`,
    );
    const status = result.data?.status;
    console.log(`Task status [${i + 1}/60]:`, status);
    if (status === "stopped") {
      const exitStatus = result.data?.exitstatus;
      if (exitStatus !== "OK") throw new Error(`Task failed: ${exitStatus}`);
      return;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Task timed out after 3 minutes");
}

export async function cloneTemplate(
  node: string,
  templateId: number,
  newVmId: number,
  name: string,
): Promise<void> {
  const result = await proxmoxRequest(
    `/nodes/${node}/qemu/${templateId}/clone`,
    {
      method: "POST",
      body: JSON.stringify({ newid: newVmId, name, full: true }),
    },
  );
  const upid = result.data;
  console.log("Clone task UPID:", upid);
  await waitForTask(node, upid);
}

export async function startVm(node: string, vmId: number): Promise<void> {
  const result = await proxmoxRequest(
    `/nodes/${node}/qemu/${vmId}/status/start`,
    { method: "POST" },
  );
  const upid = result.data;
  console.log("Start task UPID:", upid);
  await waitForTask(node, upid);
}

export async function stopVm(node: string, vmId: number): Promise<void> {
  const result = await proxmoxRequest(
    `/nodes/${node}/qemu/${vmId}/status/stop`,
    { method: "POST" },
  );
  const upid = result.data;
  await waitForTask(node, upid);
}

export async function deleteVm(node: string, vmId: number): Promise<void> {
  const result = await proxmoxRequest(`/nodes/${node}/qemu/${vmId}`, {
    method: "DELETE",
  });
  const upid = result.data;
  if (upid) await waitForTask(node, upid);
}

export async function getVmStatus(
  node: string,
  vmId: number,
): Promise<{ status: string; cpu: number; mem: number; maxmem: number }> {
  const result = await proxmoxRequest(
    `/nodes/${node}/qemu/${vmId}/status/current`,
  );
  return result.data;
}
export async function configureVm(
  node: string,
  vmId: number,
  config: {
    cores?: number;
    memory?: number;
    net0?: string;
    ipconfig0?: string;
    ciuser?: string;
    sshkeys?: string;
  },
): Promise<void> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(config)) {
    if (v !== undefined) params.append(k, String(v));
  }
  await proxmoxRequest(
    `/nodes/${node}/qemu/${vmId}/config?${params.toString()}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
}

export async function getVmNetworkInterfaces(
  node: string,
  vmId: number,
): Promise<any[]> {
  const result = await proxmoxRequest(
    `/nodes/${node}/qemu/${vmId}/agent/network-get-interfaces`,
  );
  return result.data?.result ?? [];
}
