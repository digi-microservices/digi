import { query, mutate } from "../lib/api.js";
import { colors, success, error, log, newline, table, spinner } from "../lib/output.js";

interface EnvVar {
  key: string;
  value: string;
}

interface ListEnvResponse {
  serviceEnvVars: EnvVar[];
}

interface SetEnvResponse {
  setEnvVars: { key: string; value: string }[];
}

async function listEnv(serviceId: string): Promise<void> {
  if (!serviceId) {
    error("Service ID is required. Usage: digi env list <serviceId>");
    process.exit(1);
  }

  const spin = spinner("Fetching environment variables...");

  try {
    const data = await query<ListEnvResponse>(
      `query ServiceEnvVars($serviceId: ID!) {
        serviceEnvVars(serviceId: $serviceId) { key value }
      }`,
      { serviceId },
    );

    spin.stop();

    if (data.serviceEnvVars.length === 0) {
      log("\nNo environment variables set.");
      log(`Use ${colors.bold("digi env set <serviceId> KEY=VALUE")} to add some.`);
      return;
    }

    newline();
    table(
      ["KEY", "VALUE"],
      data.serviceEnvVars.map((v) => [v.key, v.value]),
    );
    newline();
  } catch (err) {
    spin.stop();
    error(`Failed to list env vars: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function setEnv(serviceId: string, pairs: string[]): Promise<void> {
  if (!serviceId) {
    error("Service ID is required. Usage: digi env set <serviceId> KEY=VALUE [KEY=VALUE...]");
    process.exit(1);
  }

  if (pairs.length === 0) {
    error("At least one KEY=VALUE pair is required.");
    process.exit(1);
  }

  const envVars: EnvVar[] = [];
  for (const pair of pairs) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) {
      error(`Invalid format: ${colors.bold(pair)}. Expected KEY=VALUE.`);
      process.exit(1);
    }
    const key = pair.slice(0, eqIndex);
    const value = pair.slice(eqIndex + 1);
    if (!key) {
      error(`Invalid key in: ${colors.bold(pair)}`);
      process.exit(1);
    }
    envVars.push({ key, value });
  }

  const spin = spinner("Setting environment variables...");

  try {
    const data = await mutate<SetEnvResponse>(
      `mutation SetEnvVars($serviceId: ID!, $envVars: [EnvVarInput!]!) {
        setEnvVars(serviceId: $serviceId, envVars: $envVars) { key value }
      }`,
      { serviceId, envVars },
    );

    spin.stop(undefined);
    success(`Set ${data.setEnvVars.length} environment variable(s).`);
    for (const v of data.setEnvVars) {
      log(`  ${colors.bold(v.key)} = ${v.value}`);
    }
  } catch (err) {
    spin.stop();
    error(`Failed to set env vars: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

export async function envCommand(args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case "list":
      await listEnv(args[1] ?? "");
      break;
    case "set":
      await setEnv(args[1] ?? "", args.slice(2));
      break;
    default:
      error(`Unknown subcommand: ${subcommand ?? "(none)"}`);
      log("\nUsage: digi env <list|set> <serviceId> [KEY=VALUE ...]");
      process.exit(1);
  }
}
