import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const servers = pgTable("servers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  hostname: text("hostname").notNull(),
  port: integer("port").notNull().default(8006),
  apiTokenId: text("api_token_id").notNull(),
  apiTokenSecret: text("api_token_secret").notNull(),
  region: text("region").notNull().default("uk"),
  status: text("status", {
    enum: ["active", "maintenance", "offline"],
  })
    .notNull()
    .default("active"),
  maxVms: integer("max_vms").notNull().default(50),
  metadata: jsonb("metadata").$type<{
    cpuCores?: number;
    ramGb?: number;
    storageTb?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
