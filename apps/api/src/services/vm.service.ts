import { eq, and } from "drizzle-orm";
import { vms, ipPool, servers } from "@digi/db/schema";
import { type Database } from "@digi/db";
import { generateId } from "@digi/shared/utils";
import * as proxmox from "./proxmox.service.js";

export async function provisionVm(
  db: Database,
  serverId: string,
  name: string
): Promise<string> {
  const server = await db.query.servers.findFirst({
    where: eq(servers.id, serverId),
  });

  if (!server) throw new Error(`Server ${serverId} not found`);

  // Claim an IP from the pool
  const availableIp = await db.query.ipPool.findFirst({
    where: eq(ipPool.isAssigned, false),
  });

  if (!availableIp) throw new Error("No available IP addresses in pool");

  // Generate a Proxmox VM ID (use timestamp-based)
  const proxmoxVmId = 100 + Math.floor(Math.random() * 9900);
  const vmId = generateId();

  // Clone template
  const templateId = parseInt(process.env.PROXMOX_TEMPLATE_ID ?? "100");
  await proxmox.cloneTemplate(server.name, templateId, proxmoxVmId, name);

  // Configure VM networking with the assigned IP
  await proxmox.configureVm(server.name, proxmoxVmId, {
    net0: `virtio,bridge=vmbr0,tag=100`,
  });

  // Start the VM
  await proxmox.startVm(server.name, proxmoxVmId);

  // Register in DB
  await db.insert(vms).values({
    id: vmId,
    serverId,
    proxmoxVmId,
    name,
    ipAddress: availableIp.ipAddress,
    status: "provisioning",
  });

  // Mark IP as assigned
  await db
    .update(ipPool)
    .set({ isAssigned: true, vmId })
    .where(eq(ipPool.id, availableIp.id));

  // Wait for VM to become reachable (simplified)
  let reachable = false;
  for (let i = 0; i < 30; i++) {
    try {
      const proc = Bun.spawn(
        ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=5", `root@${availableIp.ipAddress}`, "echo ok"],
        { stdout: "pipe" }
      );
      const output = await new Response(proc.stdout).text();
      if (output.trim() === "ok") {
        reachable = true;
        break;
      }
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 10000));
  }

  if (!reachable) {
    await db
      .update(vms)
      .set({ status: "error" })
      .where(eq(vms.id, vmId));
    throw new Error(`VM ${vmId} failed to become reachable`);
  }

  await db
    .update(vms)
    .set({ status: "running" })
    .where(eq(vms.id, vmId));

  return vmId;
}

export async function destroyVm(
  db: Database,
  vmId: string
): Promise<void> {
  const vm = await db.query.vms.findFirst({
    where: eq(vms.id, vmId),
    with: { server: true },
  });

  if (!vm) throw new Error(`VM ${vmId} not found`);

  await db
    .update(vms)
    .set({ status: "destroying" })
    .where(eq(vms.id, vmId));

  // Stop and delete in Proxmox
  if (vm.server) {
    try {
      await proxmox.stopVm(vm.server.name, vm.proxmoxVmId);
    } catch {
      // May already be stopped
    }
    await proxmox.deleteVm(vm.server.name, vm.proxmoxVmId);
  }

  // Release IP back to pool
  if (vm.ipAddress) {
    await db
      .update(ipPool)
      .set({ isAssigned: false, vmId: null })
      .where(and(eq(ipPool.vmId, vmId)));
  }

  // Delete VM record
  await db.delete(vms).where(eq(vms.id, vmId));
}
