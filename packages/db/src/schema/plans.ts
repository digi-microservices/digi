import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  stripePriceId: text("stripe_price_id"),
  diskGb: integer("disk_gb").notNull(),
  maxServices: integer("max_services").notNull(),
  priceMonthPence: integer("price_month_pence").notNull(),
  extraStoragePricePer32Gb: integer("extra_storage_price_per_32gb"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
