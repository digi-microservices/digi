import { eq } from "drizzle-orm";
import { vms, servers } from "@digi/db/schema";
import { type Database } from "@digi/db";
import { generateId } from "@digi/shared/utils";
import * as proxmox from "./proxmox.service";

const SSH_OPTS = ["-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10"];

async function sshExec(ip: string, command: string): Promise<string> {
  const proc = Bun.spawn(["ssh", ...SSH_OPTS, `root@${ip}`, command], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`SSH command failed (${exitCode}): ${err}`);
  }
  return output.trim();
}

async function scpFile(
  localPath: string,
  ip: string,
  remotePath: string,
): Promise<void> {
  const proc = Bun.spawn(
    ["scp", ...SSH_OPTS, localPath, `root@${ip}:${remotePath}`],
    { stdout: "pipe", stderr: "pipe" },
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`SCP failed (${exitCode}): ${err}`);
  }
}

export async function provisionVm(
  db: Database,
  serverId: string,
  name: string,
): Promise<string> {
  console.log(serverId);
  const server = await db.query.servers.findFirst({
    where: eq(servers.id, serverId),
  });
  if (!server) throw new Error(`Server ${serverId} not found`);

  const proxmoxVmId = 100 + Math.floor(Math.random() * 9900);
  const vmId = generateId("vm");
  const nodeName = server.name.toLowerCase();

  console.log(
    "Cloning template on Proxmox node",
    nodeName,
    "with VM ID",
    proxmoxVmId,
  );
  const templateId = parseInt(process.env.PROXMOX_TEMPLATE_ID ?? "100");
  await proxmox.cloneTemplate(nodeName, templateId, proxmoxVmId, name);

  console.log("Configuring VM network");
  await proxmox.configureVm(nodeName, proxmoxVmId, {
    ipconfig0: "ip=dhcp",
    ciuser: "root",
    cores: 6,
    memory: 6192,
  });

  console.log("Starting VM on Proxmox node", nodeName);
  await proxmox.startVm(nodeName, proxmoxVmId);

  await db.insert(vms).values({
    id: vmId,
    serverId,
    proxmoxVmId,
    name,
    ipAddress: null,
    status: "provisioning",
    cpuCores: 6,
    memoryMb: 6192,
    diskGb: 50,
  });

  // Poll for DHCP IP via guest agent
  console.log("Waiting for VM to get DHCP IP...");
  let ipAddress: string | null = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 10000));
    try {
      const networkInfo = await proxmox.getVmNetworkInterfaces(
        nodeName,
        proxmoxVmId,
      );
      const iface = networkInfo?.find(
        (i: any) => i.name !== "lo" && i["ip-addresses"]?.length > 0,
      );
      const ip = iface?.["ip-addresses"]?.find(
        (a: any) => a["ip-address-type"] === "ipv4",
      )?.["ip-address"];
      if (ip) {
        ipAddress = ip;
        console.log("VM got DHCP IP:", ipAddress);
        break;
      }
    } catch {
      // Guest agent not ready yet
    }
    console.log(`Waiting for IP... attempt ${i + 1}/30`);
  }

  if (!ipAddress) {
    await db.update(vms).set({ status: "error" }).where(eq(vms.id, vmId));
    throw new Error(`VM ${vmId} failed to get an IP address`);
  }

  await db.update(vms).set({ ipAddress }).where(eq(vms.id, vmId));

  // Wait for SSH to become available
  console.log("Waiting for SSH to become available...");
  let sshReady = false;
  for (let i = 0; i < 20; i++) {
    try {
      await sshExec(ipAddress, "echo ok");
      sshReady = true;
      break;
    } catch {
      console.log(`SSH not ready yet... attempt ${i + 1}/20`);
      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  if (!sshReady) {
    await db.update(vms).set({ status: "error" }).where(eq(vms.id, vmId));
    throw new Error(`VM ${vmId} SSH never became available`);
  }

  // Install Tailscale
  const tsAuthKey = process.env.TAILSCALE_AUTH_KEY;
  if (!tsAuthKey) throw new Error("TAILSCALE_AUTH_KEY not set");

  console.log("Installing Tailscale...");
  await sshExec(ipAddress, "curl -fsSL https://tailscale.com/install.sh | sh");
  await sshExec(
    ipAddress,
    `tailscale up --authkey=${tsAuthKey} --accept-routes`,
  );
  console.log("Tailscale installed and connected");

  // Install Caddy
  console.log("Installing Caddy...");
  await sshExec(
    ipAddress,
    "apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl",
  );
  await sshExec(
    ipAddress,
    "curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg",
  );
  await sshExec(
    ipAddress,
    "curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list",
  );
  await sshExec(ipAddress, "apt-get update && apt-get install -y caddy");
  console.log("Caddy installed");

  // Copy Caddyfile
  console.log("Copying Caddyfile...");
  await scpFile(
    `${process.cwd()}/template/Caddyfile`,
    ipAddress,
    "/etc/caddy/Caddyfile",
  );

  // Reload Caddy
  console.log("Reloading Caddy...");
  await sshExec(
    ipAddress,
    "systemctl enable caddy && systemctl reload-or-restart caddy",
  );
  console.log("Caddy configured and running");

  // Mark VM as running
  await db.update(vms).set({ status: "running" }).where(eq(vms.id, vmId));
  console.log("VM provisioned successfully:", vmId, ipAddress);
  return vmId;
}

export async function destroyVm(db: Database, vmId: string): Promise<void> {
  const vm = await db.query.vms.findFirst({
    where: eq(vms.id, vmId),
    with: { server: true },
  });
  if (!vm) throw new Error(`VM ${vmId} not found`);

  await db.update(vms).set({ status: "destroying" }).where(eq(vms.id, vmId));

  if (vm.server) {
    const nodeName = vm.server.name.toLowerCase();
    try {
      await proxmox.stopVm(nodeName, vm.proxmoxVmId);
    } catch {
      // May already be stopped
    }
    await proxmox.deleteVm(nodeName, vm.proxmoxVmId);
  }

  await db.delete(vms).where(eq(vms.id, vmId));
}
