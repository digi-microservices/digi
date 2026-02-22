import {
  type Client,
  EmbedBuilder,
  PermissionFlagsBits,
  OverwriteType,
  ChannelType,
} from "discord.js";
import { eq } from "drizzle-orm";
import {
  type Database,
  tickets,
  guildSettings,
  ticketHelperRoles,
} from "@digi/db";
import { openTicketChannels } from "./ticket-open";

export async function closeTicket(
  channelId: string,
  closerDiscordUserId: string,
  db: Database,
  client: Client,
  dashboardUrl: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.channelId, channelId),
  });

  if (!ticket) {
    return { success: false, error: "This channel is not a ticket." };
  }

  if (ticket.status !== "open") {
    return { success: false, error: "This ticket is not open." };
  }

  // Validate permissions: opener, claimed helper, or any helper role member
  const isOpener = ticket.openerDiscordUserId === closerDiscordUserId;
  const isClaimed = ticket.claimedByDiscordUserId === closerDiscordUserId;

  if (!isOpener && !isClaimed) {
    // Check if user has a helper role
    const settings = await db.query.guildSettings.findFirst({
      where: eq(guildSettings.id, ticket.guildSettingsId),
      with: { helperRoles: true },
    });

    if (settings) {
      const guild = client.guilds.cache.get(settings.guildId);
      const member = guild?.members.cache.get(closerDiscordUserId);
      const helperRoleIds = settings.helperRoles.map((r) => r.roleId);
      const hasHelperRole = member?.roles.cache.some((r) =>
        helperRoleIds.includes(r.id),
      );

      if (!hasHelperRole) {
        return {
          success: false,
          error: "You do not have permission to close this ticket.",
        };
      }
    }
  }

  const closedAt = new Date();
  const scheduledDeleteAt = new Date(closedAt.getTime() + 48 * 60 * 60 * 1000);

  await db
    .update(tickets)
    .set({
      status: "closed",
      closeReason: reason ?? null,
      closedAt,
      closedByDiscordUserId: closerDiscordUserId,
      scheduledDeleteAt,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticket.id));

  openTicketChannels.delete(channelId);

  // Lock channel and send embed
  const guild = client.guilds.cache.find((g) =>
    g.channels.cache.has(channelId),
  );
  const channel = guild?.channels.cache.get(channelId);

  if (channel?.type === ChannelType.GuildText) {
    // Deny SendMessages for everyone
    await channel.permissionOverwrites.edit(guild!.roles.everyone, {
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setTitle("Ticket Closed")
      .setDescription(
        [
          reason ? `**Reason:** ${reason}` : null,
          `\n[View transcript →](${dashboardUrl}/tickets/${ticket.id})`,
        ]
          .filter(Boolean)
          .join("\n"),
      )
      .setColor(0xef4444)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }

  return { success: true };
}
