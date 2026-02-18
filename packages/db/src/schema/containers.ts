import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { services } from "./services";

export const containers = pgTable("containers", {
  id: text("id").primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["app", "postgres", "redis", "docker"],
  }).notNull(),
  name: text("name").notNull(),
  dockerContainerId: text("docker_container_id"),
  dockerImage: text("docker_image"),
  subdomain: text("subdomain").unique(),
  internalPort: integer("internal_port"),
  externalPort: integer("external_port"),
  status: text("status", {
    enum: ["pending", "creating", "running", "stopped", "error", "destroying"],
  })
    .notNull()
    .default("pending"),
  envVars: jsonb("env_vars")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  resourceLimits: jsonb("resource_limits")
    .$type<{
      memory?: string;
      cpus?: string;
      storage?: string;
    }>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
