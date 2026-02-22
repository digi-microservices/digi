import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { type Database } from "@digi/db";
import { claimTicket } from "../../handlers/ticket-claim";

export const ticketClaimCommand = new SlashCommandBuilder()
  .setName("ticket-claim")
  .setDescription("Claim this support ticket");

export async function handleTicketClaim(
  interaction: ChatInputCommandInteraction,
  db: Database,
) {
  await interaction.deferReply({ ephemeral: true });

  const result = await claimTicket(
    interaction.channelId,
    interaction.user.id,
    interaction.user.username,
    db,
    interaction.client,
  );

  if (!result.success) {
    await interaction.editReply(result.error ?? "Failed to claim ticket.");
    return;
  }

  await interaction.editReply("You have claimed this ticket.");
}
