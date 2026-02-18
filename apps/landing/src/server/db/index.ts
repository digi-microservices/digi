import { createDb } from "@digi/db";
import { env } from "~/env";

export const db = createDb(env.DATABASE_URL);
