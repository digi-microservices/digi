import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { services } from "./services";

export const customDomains = pgTable("custom_domains", {
  id: text("id").primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  domain: text("domain").notNull().unique(),
  verificationToken: text("verification_token"),
  isVerified: boolean("is_verified").notNull().default(false),
  sslStatus: text("ssl_status", {
    enum: ["pending", "active", "error"],
  })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
