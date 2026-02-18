import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { customDomains } from "./custom-domains";
import { services } from "./services";

export const dnsRecords = pgTable("dns_records", {
  id: text("id").primaryKey(),
  domainId: text("domain_id").references(() => customDomains.id, {
    onDelete: "cascade",
  }),
  serviceId: text("service_id").references(() => services.id, {
    onDelete: "cascade",
  }),
  cloudflareRecordId: text("cloudflare_record_id"),
  type: text("type", { enum: ["A", "CNAME", "TXT"] }).notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  proxied: boolean("proxied").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
