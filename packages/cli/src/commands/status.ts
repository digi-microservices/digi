import { requireConfig } from "../lib/config.js";
import { colors, success, error, info, log, newline, spinner } from "../lib/output.js";

interface HealthResponse {
  status: string;
  version?: string;
  uptime?: number;
  [key: string]: unknown;
}

export async function statusCommand(_args: string[]): Promise<void> {
  const config = requireConfig();
  const healthUrl = `${config.api_url}/health`;

  const spin = spinner("Checking platform health...");

  try {
    const start = Date.now();
    const response = await fetch(healthUrl);
    const latency = Date.now() - start;

    if (!response.ok) {
      spin.stop(undefined);
      error(`Platform returned HTTP ${response.status} ${response.statusText}`);
      process.exit(1);
    }

    const data = (await response.json()) as HealthResponse;
    spin.stop(undefined);

    newline();
    log(`  ${colors.bold("Platform:")}  ${colors.green("healthy")}`);
    log(`  ${colors.bold("API URL:")}   ${config.api_url}`);
    log(`  ${colors.bold("Latency:")}   ${latency}ms`);

    if (data.version) {
      log(`  ${colors.bold("Version:")}   ${data.version}`);
    }

    if (data.uptime !== undefined) {
      const hours = Math.floor(data.uptime / 3600);
      const minutes = Math.floor((data.uptime % 3600) / 60);
      log(`  ${colors.bold("Uptime:")}    ${hours}h ${minutes}m`);
    }

    newline();
    success("Platform is operational.");
  } catch (err) {
    spin.stop(undefined);
    error(
      `Cannot reach platform at ${colors.bold(healthUrl)}`,
    );
    log(`  ${colors.dim(err instanceof Error ? err.message : String(err))}`);
    newline();
    info("Is the API server running? Check your API URL with " + colors.bold("digi login") + ".");
    process.exit(1);
  }
}
