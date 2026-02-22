import { type Client } from "discord.js";
import { eq } from "drizzle-orm";
import { type Database, tickets } from "@digi/db";
import { type RedisClient } from "@digi/redis";
import { openTicketChannels } from "../handlers/ticket-open";
import { startInactivityCheck } from "../schedulers/inactivity-check";
import { startAutoDelete } from "../schedulers/auto-delete";
import { env } from "../env";

export function registerReadyEvent(
  client: Client,
  { db }: { db: Database; redis: RedisClient },
) {
  client.once("clientReady", async (c) => {
    console.log(`Logged in as ${c.user.tag}`);

    // Seed in-memory open ticket channel cache
    const openTickets = await db.query.tickets.findMany({
      where: eq(tickets.status, "open"),
      columns: { channelId: true },
    });

    for (const t of openTickets) {
      openTicketChannels.add(t.channelId);
    }

    console.log(`Cached ${openTicketChannels.size} open ticket channels`);

    // Start schedulers
    startInactivityCheck(db, client, env.BOT_DASHBOARD_URL);
    startAutoDelete(db, client);
  });
}
