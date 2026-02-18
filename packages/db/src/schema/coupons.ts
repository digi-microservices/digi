import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const coupons = pgTable("coupons", {
  id: text("id").primaryKey(),
  stripeCouponId: text("stripe_coupon_id"),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percentage", "fixed"] }).notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").default("gbp"),
  expiresAt: timestamp("expires_at"),
  maxRedemptions: integer("max_redemptions"),
  timesRedeemed: integer("times_redeemed").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
