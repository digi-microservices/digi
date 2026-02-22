import { type Client, type Interaction, InteractionType } from "discord.js";
import { type Database } from "@digi/db";
import { env } from "../env";
import { openTicket } from "../handlers/ticket-open";
import { closeTicket } from "../handlers/ticket-close";
import { claimTicket } from "../handlers/ticket-claim";
import { handleSetupBuildServer } from "../commands/setup/build-server";
import { handleSetupTicketPanel } from "../commands/setup/ticket-panel";
import { handleSetupHelperRole } from "../commands/setup/helper-role";
import { handleTicketClose } from "../commands/ticket/close";
import { handleTicketClaim } from "../commands/ticket/claim";
import { handleTicketUnclaim } from "../commands/ticket/unclaim";
import { handleTicketTag } from "../commands/ticket/tag";

export function registerInteractionCreateEvent(
  client: Client,
  { db }: { db: Database },
) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      // Handle button interactions
      if (interaction.isButton()) {
        const [prefix, action, ticketId] = interaction.customId.split(":");

        if (prefix !== "ticket") return;

        if (action === "open") {
          await openTicket(interaction, db);
          return;
        }

        if (action === "close" && ticketId) {
          const result = await closeTicket(
            interaction.channelId,
            interaction.user.id,
            db,
            client,
            env.BOT_DASHBOARD_URL,
          );
          if (result.success) {
            await interaction.reply({
              content: "Ticket closed.",
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: result.error ?? "Failed to close ticket.",
              ephemeral: true,
            });
          }
          return;
        }

        if (action === "claim" && ticketId) {
          const result = await claimTicket(
            interaction.channelId,
            interaction.user.id,
            interaction.user.username,
            db,
            client,
          );
          if (result.success) {
            await interaction.reply({
              content: "You have claimed this ticket.",
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: result.error ?? "Failed to claim ticket.",
              ephemeral: true,
            });
          }
          return;
        }
      }

      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === "setup") {
          const sub = interaction.options.getSubcommand();
          if (sub === "build-server") {
            await handleSetupBuildServer(interaction, db);
          }
          return;
        }

        if (commandName === "setup-ticket-panel") {
          await handleSetupTicketPanel(interaction, db);
          return;
        }

        if (commandName === "setup-helper-role") {
          await handleSetupHelperRole(interaction, db);
          return;
        }

        if (commandName === "ticket-close") {
          await handleTicketClose(interaction, db, env.BOT_DASHBOARD_URL);
          return;
        }

        if (commandName === "ticket-claim") {
          await handleTicketClaim(interaction, db);
          return;
        }

        if (commandName === "ticket-unclaim") {
          await handleTicketUnclaim(interaction, db);
          return;
        }

        if (commandName === "ticket-tag") {
          await handleTicketTag(interaction, db);
          return;
        }
      }
    } catch (err) {
      console.error("Error handling interaction:", err);
    }
  });
}
