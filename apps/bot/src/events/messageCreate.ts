import { type Client, type Message } from "discord.js";
import { eq } from "drizzle-orm";
import {
  type Database,
  tickets,
  ticketMessages,
  ticketAttachments,
} from "@digi/db";
import { type RedisClient } from "@digi/redis";
import { openTicketChannels } from "../handlers/ticket-open";
import { generateId } from "@digi/shared/utils";

export function registerMessageCreateEvent(
  client: Client,
  { db }: { db: Database; redis: RedisClient },
) {
  client.on("messageCreate", async (message: Message) => {
    // Only process messages in known open ticket channels
    if (!openTicketChannels.has(message.channelId)) return;

    // Skip system messages
    if (message.system) return;

    try {
      // Update last_message_at on the ticket
      await db
        .update(tickets)
        .set({ lastMessageAt: message.createdAt, updatedAt: new Date() })
        .where(eq(tickets.channelId, message.channelId));

      // Sync message to DB
      const msgRecord = await db
        .insert(ticketMessages)
        .values({
          id: generateId("tmg"),
          ticketId: await getTicketId(message.channelId, db),
          discordMessageId: message.id,
          authorDiscordUserId: message.author.id,
          authorDiscordUsername: message.author.username,
          authorAvatarUrl:
            message.author.displayAvatarURL({ size: 64 }) ?? null,
          content: message.content ?? "",
          isBot: message.author.bot,
          createdAt: message.createdAt,
        })
        .returning({ id: ticketMessages.id });

      // Sync attachments
      if (message.attachments.size > 0 && msgRecord[0]) {
        for (const [, attachment] of message.attachments) {
          await db.insert(ticketAttachments).values({
            id: generateId("tat"),
            messageId: msgRecord[0].id,
            discordAttachmentId: attachment.id,
            filename: attachment.name,
            contentType: attachment.contentType ?? null,
            url: attachment.url,
            sizeBytes: attachment.size,
          });
        }
      }
    } catch (err) {
      console.error("Error syncing message:", err);
    }
  });
}

async function getTicketId(channelId: string, db: Database): Promise<string> {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.channelId, channelId),
    columns: { id: true },
  });
  return ticket?.id ?? "";
}
