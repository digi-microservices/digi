import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  ChannelType,
  OverwriteType,
} from "discord.js";
import { eq } from "drizzle-orm";
import { type Database, guildSettings } from "@digi/db";
import { generateId } from "@digi/shared/utils";

export const setupBuildServerCommand = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Server setup commands")
  .addSubcommand((sub) =>
    sub
      .setName("build-server")
      .setDescription("Scaffold the full server channel structure (admin only)")
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handleSetupBuildServer(
  interaction: ChatInputCommandInteraction,
  db: Database
) {
  await interaction.deferReply();

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply("This command can only be used in a server.");
    return;
  }

  try {
    const everyoneRole = guild.roles.everyone;

    // Create stat VCs (no category, deny Connect for everyone)
    const statsServerVc = await guild.channels.create({
      name: "Servers: 0",
      type: ChannelType.GuildVoice,
      position: 0,
      permissionOverwrites: [
        { id: everyoneRole.id, type: OverwriteType.Role, deny: ["Connect"] },
      ],
    });

    const statsVmVc = await guild.channels.create({
      name: "VMs: 0",
      type: ChannelType.GuildVoice,
      position: 1,
      permissionOverwrites: [
        { id: everyoneRole.id, type: OverwriteType.Role, deny: ["Connect"] },
      ],
    });

    const statsMembersVc = await guild.channels.create({
      name: "Members: 0",
      type: ChannelType.GuildVoice,
      position: 2,
      permissionOverwrites: [
        { id: everyoneRole.id, type: OverwriteType.Role, deny: ["Connect"] },
      ],
    });

    // Create ANNOUNCEMENTS category
    const announcementsCategory = await guild.channels.create({
      name: "announcements",
      type: ChannelType.GuildCategory,
    });
    await guild.channels.create({
      name: "change-log",
      type: ChannelType.GuildAnnouncement,
      parent: announcementsCategory.id,
    });
    const announcementsChannel = await guild.channels.create({
      name: "announcements",
      type: ChannelType.GuildAnnouncement,
      parent: announcementsCategory.id,
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          type: OverwriteType.Role,
          deny: ["SendMessages"],
        },
      ],
    });

    // Create COMMUNITY category
    const communityCategory = await guild.channels.create({
      name: "community",
      type: ChannelType.GuildCategory,
    });
    await guild.channels.create({
      name: "general",
      type: ChannelType.GuildText,
      parent: communityCategory.id,
    });
    await guild.channels.create({
      name: "commands",
      type: ChannelType.GuildText,
      parent: communityCategory.id,
    });
    await guild.channels.create({
      name: "support",
      type: ChannelType.GuildForum,
      parent: communityCategory.id,
    });

    // Create STAFF category
    const staffCategory = await guild.channels.create({
      name: "staff",
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          type: OverwriteType.Role,
          deny: ["ViewChannel"],
        },
      ],
    });
    await guild.channels.create({
      name: "staff-announcements",
      type: ChannelType.GuildText,
      parent: staffCategory.id,
    });
    await guild.channels.create({
      name: "staff-chat",
      type: ChannelType.GuildText,
      parent: staffCategory.id,
    });
    await guild.channels.create({
      name: "audit-logs",
      type: ChannelType.GuildText,
      parent: staffCategory.id,
    });
    const verificationChannel = await guild.channels.create({
      name: "verification",
      type: ChannelType.GuildText,
      parent: staffCategory.id,
    });

    // Create TICKETS category
    const ticketsCategory = await guild.channels.create({
      name: "tickets",
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          type: OverwriteType.Role,
          deny: ["ViewChannel"],
        },
      ],
    });

    // Upsert guild settings
    const existing = await db.query.guildSettings.findFirst({
      where: eq(guildSettings.guildId, guild.id),
    });

    if (existing) {
      await db
        .update(guildSettings)
        .set({
          ticketCategoryId: ticketsCategory.id,
          logChannelId: announcementsChannel.id,
          verificationChannelId: verificationChannel.id,
          statsServerVcId: statsServerVc.id,
          statsVmVcId: statsVmVc.id,
          statsMembersVcId: statsMembersVc.id,
          setupComplete: true,
          updatedAt: new Date(),
        })
        .where(eq(guildSettings.id, existing.id));
    } else {
      await db.insert(guildSettings).values({
        id: generateId("gld"),
        guildId: guild.id,
        ticketCategoryId: ticketsCategory.id,
        logChannelId: announcementsChannel.id,
        verificationChannelId: verificationChannel.id,
        statsServerVcId: statsServerVc.id,
        statsVmVcId: statsVmVc.id,
        statsMembersVcId: statsMembersVc.id,
        setupComplete: true,
      });
    }

    await interaction.editReply(
      "Server structure created successfully! Categories, channels, and stat VCs have been set up."
    );
  } catch (err) {
    console.error("Error in setup build-server:", err);
    await interaction.editReply(
      "An error occurred while setting up the server. Please check bot permissions."
    );
  }
}
