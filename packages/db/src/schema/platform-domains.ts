import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const platformDomains = pgTable("platform_domains", {
  id: text("id").primaryKey(),
  domain: text("domain").notNull().unique(),
  cloudflareZoneId: text("cloudflare_zone_id").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  serviceCount: integer("service_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
