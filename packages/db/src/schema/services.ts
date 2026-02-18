import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { vms } from "./vms";
import { platformDomains } from "./platform-domains";

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  vmId: text("vm_id").references(() => vms.id),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  platformDomainId: text("platform_domain_id").references(
    () => platformDomains.id
  ),
  sourceType: text("source_type", { enum: ["github", "docker"] }).notNull(),
  gitUrl: text("git_url"),
  branch: text("branch").notNull().default("main"),
  dockerImage: text("docker_image"),
  port: integer("port").notNull().default(3000),
  envVars: jsonb("env_vars")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  status: text("status", {
    enum: ["created", "deploying", "running", "stopped", "error", "destroying"],
  })
    .notNull()
    .default("created"),
  currentDeploymentId: text("current_deployment_id"),
  dashboardUrl: text("dashboard_url"),
  publicUrl: text("public_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
