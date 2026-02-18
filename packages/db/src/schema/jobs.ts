import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  type: text("type", {
    enum: ["deploy", "destroy", "scale", "build"],
  }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  status: text("status", {
    enum: ["pending", "processing", "completed", "failed", "retrying"],
  })
    .notNull()
    .default("pending"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  lastError: text("last_error"),
  scheduledAt: timestamp("scheduled_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
