import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { services } from "./services";
import { users } from "./users";

export const deployments = pgTable("deployments", {
  id: text("id").primaryKey(),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  commitSha: text("commit_sha"),
  commitMessage: text("commit_message"),
  status: text("status", {
    enum: ["queued", "building", "deploying", "live", "failed", "rolled_back"],
  })
    .notNull()
    .default("queued"),
  buildLogs: text("build_logs"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
