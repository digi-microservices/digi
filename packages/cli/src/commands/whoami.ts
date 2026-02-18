import { query } from "../lib/api.js";
import { colors, success, error, log, newline } from "../lib/output.js";

interface MeResponse {
  me: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export async function whoamiCommand(_args: string[]): Promise<void> {
  try {
    const data = await query<MeResponse>(
      `query { me { id email name role } }`,
    );

    newline();
    log(`  ${colors.bold("Email:")}  ${data.me.email}`);
    log(`  ${colors.bold("Name:")}   ${data.me.name ?? colors.dim("not set")}`);
    log(`  ${colors.bold("Role:")}   ${data.me.role}`);
    log(`  ${colors.bold("ID:")}     ${colors.dim(data.me.id)}`);
    newline();
  } catch (err) {
    error(`Failed to fetch user info: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
