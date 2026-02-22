import { type Client } from "discord.js";
import { and, eq, lt, sql } from "drizzle-orm";
import { type Database, tickets } from "@digi/db";
import { sendInactivityWarning } from "../handlers/inactivity";

const INACTIVITY_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function startInactivityCheck(
  db: Database,
  client: Client,
  dashboardUrl: string,
) {
  const run = async () => {
    try {
      const threshold = new Date(Date.now() - INACTIVITY_THRESHOLD_MS);

      const inactiveTickets = await db.query.tickets.findMany({
        where: and(
          eq(tickets.status, "open"),
          lt(tickets.lastMessageAt, threshold),
        ),
      });

      for (const ticket of inactiveTickets) {
        await sendInactivityWarning(ticket, client, dashboardUrl);
      }
    } catch (err) {
      console.error("Error in inactivity check:", err);
    }
  };

  // Run immediately, then on interval
  void run();
  setInterval(run, CHECK_INTERVAL_MS);
}
