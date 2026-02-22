#!/usr/bin/env bun

import { loginCommand } from "./commands/login";
import { logoutCommand } from "./commands/logout";
import { whoamiCommand } from "./commands/whoami";
import { servicesCommand } from "./commands/services";
import { deployCommand } from "./commands/deploy";
import { logsCommand } from "./commands/logs";
import { envCommand } from "./commands/env";
import { domainsCommand } from "./commands/domains";
import { statusCommand } from "./commands/status";
import { initCommand } from "./commands/init";
import { colors, error, log, newline } from "./lib/output";

const VERSION = "0.1.0";

const HELP = `
${colors.bold("digi")} — Digi PaaS CLI v${VERSION}

${colors.bold("Getting Started:")}
  ${colors.blue("init")} <name>          Initialize a new project
  ${colors.blue("login")}               Authenticate with Digi
  ${colors.blue("logout")}              Clear saved credentials
  ${colors.blue("whoami")}              Show current user
  ${colors.blue("status")}              Check platform health

${colors.bold("Services:")}
  ${colors.blue("services")} list        List all services
  ${colors.blue("services")} create      Create a new service
  ${colors.blue("services")} info <id>   Service details
  ${colors.blue("services")} delete <id> Delete a service

${colors.bold("Deployment:")}
  ${colors.blue("deploy")}              Deploy from digi.toml
  ${colors.blue("deploy")} --only <c>   Deploy specific components
  ${colors.blue("logs")} <id>           Stream service logs

${colors.bold("Configuration:")}
  ${colors.blue("env")} list <id>       List environment variables
  ${colors.blue("env")} set <id> K=V    Set environment variables
  ${colors.blue("domains")} list        List platform domains
  ${colors.blue("domains")} add <id> <d> Add custom domain

${colors.bold("Flags:")}
  --help, -h           Show this help
  --version, -v        Show version

Run ${colors.bold("digi <command> --help")} for command-specific help.
`;

type CommandHandler = (args: string[]) => Promise<void>;

const commands: Record<string, CommandHandler> = {
  init: initCommand,
  login: loginCommand,
  logout: logoutCommand,
  whoami: whoamiCommand,
  services: servicesCommand,
  deploy: deployCommand,
  logs: logsCommand,
  env: envCommand,
  domains: domainsCommand,
  status: statusCommand,
};

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    log(HELP);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    log(`digi v${VERSION}`);
    process.exit(0);
  }

  const command = args[0]!;
  const handler = commands[command];

  if (!handler) {
    error(`Unknown command: ${colors.bold(command)}`);
    newline();
    log(`Run ${colors.bold("digi --help")} to see available commands.`);
    process.exit(1);
  }

  try {
    await handler(args.slice(1));
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
