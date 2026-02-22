import { Client, GatewayIntentBits, Partials } from "discord.js";
import { createDb } from "@digi/db";
import { createRedisClient } from "@digi/redis";
import { env } from "./env";
import { registerEvents } from "./events/index";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel],
});

const db = createDb(env.DATABASE_URL);
const redis = createRedisClient(env.REDIS_URL);

registerEvents(client, { db, redis });

client.login(env.DISCORD_BOT_TOKEN).catch((err) => {
  console.error("Failed to login:", err);
  process.exit(1);
});
