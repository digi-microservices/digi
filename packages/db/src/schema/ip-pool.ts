import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { vms } from "./vms";

export const ipPool = pgTable("ip_pool", {
  id: text("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  vmId: text("vm_id").references(() => vms.id, { onDelete: "set null" }),
  isAssigned: boolean("is_assigned").notNull().default(false),
  subnet: text("subnet").notNull(),
  gateway: text("gateway").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
