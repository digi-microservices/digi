import { eq } from "drizzle-orm";
import { services, containers, dnsRecords } from "@digi/db/schema";
import { type Database } from "@digi/db";
import { type Cache } from "@digi/redis/cache";
import { CacheKeys } from "@digi/redis/cache";
import * as docker from "../../services/docker.service";
import * as caddy from "../../services/caddy.service";
import * as cloudflare from "../../services/cloudflare.service";

export async function executeDestroy(
  db: Database,
  cache: Cache,
  payload: Record<string, unknown>,
): Promise<void> {
  const serviceId = payload.serviceId as string;

  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
    with: {
      containers: true,
      vm: true,
      dnsRecords: true,
      platformDomain: true,
    },
  });

  if (!service) throw new Error(`Service ${serviceId} not found`);

  const vmIp = service.vm?.ipAddress;

  // Stop and remove all Docker containers
  if (vmIp) {
    for (const container of service.containers) {
      if (container.dockerContainerId) {
        try {
          await docker.removeContainer(vmIp, container.dockerContainerId);
        } catch {
          // Container may already be removed
        }
      }

      // Remove VM-level Caddy route
      if (container.subdomain) {
        try {
          const vmCaddyUrl = `http://${vmIp}:2019`;
          await caddy.removeRoute(vmCaddyUrl, container.subdomain);
        } catch {
          // Route may not exist
        }
      }
    }
  }

  // Remove Master Caddy routes
  const masterCaddyUrl = process.env.MASTER_CADDY_URL;
  if (masterCaddyUrl) {
    for (const container of service.containers) {
      if (container.subdomain) {
        try {
          await caddy.removeRoute(masterCaddyUrl, container.subdomain);
        } catch {
          // Route may not exist
        }
      }
    }
  }

  // Delete DNS records from Cloudflare
  if (service.platformDomain) {
    for (const record of service.dnsRecords) {
      if (record.cloudflareRecordId) {
        try {
          await cloudflare.deleteDnsRecord(
            service.platformDomain.cloudflareZoneId,
            record.cloudflareRecordId,
          );
        } catch {
          // Record may already be deleted
        }
      }
    }
  }

  // Delete from database (cascades to containers, deployments, etc.)
  await db.delete(services).where(eq(services.id, serviceId));

  // Update domain service count
  if (service.platformDomainId) {
    const { platformDomains } = await import("@digi/db/schema");
    const domain = await db.query.platformDomains.findFirst({
      where: eq(platformDomains.id, service.platformDomainId),
    });
    if (domain && domain.serviceCount > 0) {
      await db
        .update(platformDomains)
        .set({ serviceCount: domain.serviceCount - 1 })
        .where(eq(platformDomains.id, service.platformDomainId));
    }
  }

  // Invalidate cache
  await cache.del(CacheKeys.userServices(service.userId));
  await cache.del(CacheKeys.domainList());
}
