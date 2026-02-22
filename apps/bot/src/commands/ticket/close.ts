import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { type Database } from "@digi/db";
import { closeTicket } from "../../handlers/ticket-close";

export const ticketCloseCommand = new SlashCommandBuilder()
  .setName("ticket-close")
  .setDescription("Close this support ticket")
  .addStringOption((opt) =>
    opt
      .setName("reason")
      .setDescription("Reason for closing (optional)")
      .setRequired(false),
  );

export async function handleTicketClose(
  interaction: ChatInputCommandInteraction,
  db: Database,
  dashboardUrl: string,
) {
  await interaction.deferReply({ ephemeral: true });

  const reason = interaction.options.getString("reason") ?? undefined;

  const result = await closeTicket(
    interaction.channelId,
    interaction.user.id,
    db,
    interaction.client,
    dashboardUrl,
    reason,
  );

  if (!result.success) {
    await interaction.editReply(result.error ?? "Failed to close ticket.");
    return;
  }

  await interaction.editReply("Ticket closed.");
}
