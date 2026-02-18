import { pgTable, serial, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const waitlist = pgTable(
  "waitlist",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
  })
);
