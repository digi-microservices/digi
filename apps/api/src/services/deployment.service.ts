import { eq } from "drizzle-orm";
import {
  services,
  containers,
  deployments,
  vms,
  platformDomains,
} from "@digi/db/schema";
import { type Database } from "@digi/db";
import { type Cache } from "@digi/redis/cache";
import { type PubSub, Channels } from "@digi/redis/pubsub";
import * as docker from "./docker.service.js";
import * as caddy from "./caddy.service.js";
import { env } from "../env.js";

export async function executeDeploy(
  db: Database,
  cache: Cache,
  pubsub: PubSub,
  payload: { serviceId: string; deploymentId: string }
): Promise<void> {
  const { serviceId, deploymentId } = payload;

  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
    with: { containers: true, platformDomain: true },
  });

  if (!service) throw new Error(`Service ${serviceId} not found`);

  // Update deployment status to building
  await db
    .update(deployments)
    .set({ status: "building", startedAt: new Date() })
    .where(eq(deployments.id, deploymentId));

  await pubsub.publish(Channels.deploymentStatus(deploymentId), {
    jobId: deploymentId,
    status: "building",
    message: "Building service...",
    timestamp: new Date().toISOString(),
    progress: 20,
  });

  // Find or provision a VM
  let vm = service.vmId
    ? await db.query.vms.findFirst({ where: eq(vms.id, service.vmId) })
    : null;

  if (!vm) {
    // Select VM with most available headroom
    const allVms = await db.query.vms.findMany({
      where: eq(vms.status, "running"),
      with: { services: true },
    });

    vm = allVms.sort(
      (a, b) =>
        (a.services?.length ?? 0) - (b.services?.length ?? 0)
    )[0] ?? null;

    if (!vm) {
      throw new Error("No available VMs. Provision a new VM first.");
    }

    // Assign service to VM
    await db
      .update(services)
      .set({ vmId: vm.id })
      .where(eq(services.id, serviceId));
  }

  if (!vm.ipAddress) throw new Error(`VM ${vm.id} has no IP address`);

  // Deploy containers
  await db
    .update(deployments)
    .set({ status: "deploying" })
    .where(eq(deployments.id, deploymentId));

  await pubsub.publish(Channels.deploymentStatus(deploymentId), {
    jobId: deploymentId,
    status: "deploying",
    message: "Deploying containers...",
    timestamp: new Date().toISOString(),
    progress: 50,
  });

  for (const container of service.containers) {
    const image =
      container.dockerImage ??
      (container.type === "postgres"
        ? "postgres:16-alpine"
        : container.type === "redis"
          ? "redis:7-alpine"
          : service.dockerImage ?? "");

    if (!image) {
      // GitHub source — would use Railpack here
      // TODO: Implement Railpack build via railpack.service.ts
      continue;
    }

    // Pull image
    await docker.pullImage(vm.ipAddress, image);

    // Assign ports
    const externalPort = 10000 + Math.floor(Math.random() * 50000);

    // Run container
    const dockerId = await docker.runContainer(vm.ipAddress, {
      image,
      name: `${service.subdomain}-${container.type}-${container.id.slice(0, 8)}`,
      envVars: container.envVars as Record<string, string>,
      ports: [
        {
          host: externalPort,
          container: container.internalPort ?? (container.type === "postgres" ? 5432 : container.type === "redis" ? 6379 : 3000),
        },
      ],
      memory: (container.resourceLimits as Record<string, string>)?.memory,
      cpus: (container.resourceLimits as Record<string, string>)?.cpus,
    });

    // Update container record
    await db
      .update(containers)
      .set({
        dockerContainerId: dockerId,
        externalPort,
        status: "running",
        updatedAt: new Date(),
      })
      .where(eq(containers.id, container.id));

    // Add route on VM Caddy
    if (container.subdomain) {
      const vmCaddyUrl = `http://${vm.ipAddress}:2019`;
      await caddy.addVmRoute(
        vmCaddyUrl,
        container.subdomain,
        externalPort
      );

      // Add route on Master Caddy
      if (env.MASTER_CADDY_URL) {
        await caddy.addMasterRoute(
          env.MASTER_CADDY_URL,
          container.subdomain,
          vm.ipAddress
        );
      }
    }
  }

  // Update deployment and service status
  await db
    .update(deployments)
    .set({ status: "live", completedAt: new Date() })
    .where(eq(deployments.id, deploymentId));

  await db
    .update(services)
    .set({ status: "running", updatedAt: new Date() })
    .where(eq(services.id, serviceId));

  await pubsub.publish(Channels.deploymentStatus(deploymentId), {
    jobId: deploymentId,
    status: "live",
    message: "Deployment complete!",
    timestamp: new Date().toISOString(),
    progress: 100,
  });

  // Invalidate cache
  const { CacheKeys } = await import("@digi/redis/cache");
  await cache.del(CacheKeys.userServices(service.userId));
}
