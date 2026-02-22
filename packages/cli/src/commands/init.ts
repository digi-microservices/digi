import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { colors, success, error, info, log, newline } from "../lib/output";
import { confirm } from "../lib/prompt";

const TEMPLATE = `# digi.toml — Digi PaaS deployment config
# Docs: https://digi.run/docs/cli

[app]
source_type = "github"
repo_url = ""
branch = "main"
port = "3000"

# Uncomment to add a database:
# [postgres]
# type = "postgres"

# Uncomment to add Redis:
# [redis]
# type = "redis"
`;

export async function initCommand(args: string[]): Promise<void> {
  const name = args[0];
  const tomlPath = join(process.cwd(), "digi.toml");

  if (existsSync(tomlPath)) {
    const overwrite = await confirm(
      `${colors.yellow("⚠")} digi.toml already exists. Overwrite?`,
      false,
    );
    if (!overwrite) {
      info("Cancelled.");
      return;
    }
  }

  const content = name ? TEMPLATE.replace("[app]", `[${name}]`) : TEMPLATE;

  writeFileSync(tomlPath, content);

  newline();
  success("Created digi.toml");
  if (name) {
    success(`Project ${colors.bold(name)} initialized`);
  } else {
    success("Project initialized");
  }

  newline();
  log(`  ${colors.bold("Next steps:")}`);
  log(`    ${colors.blue("digi services create")}    Add services`);
  log(`    ${colors.blue("digi deploy")}             Deploy to digi`);
  newline();
}
