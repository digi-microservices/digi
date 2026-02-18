import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { servers } from "./servers";

export const vms = pgTable("vms", {
  id: text("id").primaryKey(),
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id),
  proxmoxVmId: integer("proxmox_vm_id").notNull(),
  name: text("name").notNull(),
  ipAddress: text("ip_address"),
  status: text("status", {
    enum: ["provisioning", "running", "stopped", "error", "destroying"],
  })
    .notNull()
    .default("provisioning"),
  cpuCores: integer("cpu_cores").notNull().default(2),
  memoryMb: integer("memory_mb").notNull().default(2048),
  diskGb: integer("disk_gb").notNull().default(50),
  sshPort: integer("ssh_port"),
  templateId: text("template_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
