import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { plans } from "./plans";

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status", {
    enum: ["active", "past_due", "cancelled", "trialing"],
  })
    .notNull()
    .default("active"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  extraStorageGb: integer("extra_storage_gb").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
