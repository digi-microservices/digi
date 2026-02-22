import { type Client } from "discord.js";
import { type Database } from "@digi/db";
import { type RedisClient } from "@digi/redis";
import { registerReadyEvent } from "./ready";
import { registerInteractionCreateEvent } from "./interactionCreate";
import { registerMessageCreateEvent } from "./messageCreate";

interface BotDeps {
  db: Database;
  redis: RedisClient;
}

export function registerEvents(client: Client, deps: BotDeps) {
  registerReadyEvent(client, deps);
  registerInteractionCreateEvent(client, deps);
  registerMessageCreateEvent(client, deps);
}
