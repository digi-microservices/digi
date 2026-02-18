import { homedir } from "os";
import { join } from "path";
import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";

export interface CliConfig {
  api_url: string;
  token: string;
}

const CONFIG_DIR = join(homedir(), ".digi");
const CONFIG_FILE = join(CONFIG_DIR, "config.toml");

/**
 * Simple TOML parser that handles basic key = "value" pairs and [section] headers.
 */
function parseTOML(input: string): Record<string, Record<string, string> | string> {
  const result: Record<string, Record<string, string> | string> = {};
  let currentSection: string | null = null;

  const lines = input.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip empty lines and comments
    if (line === "" || line.startsWith("#")) {
      continue;
    }

    // Section header: [section]
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1]!;
      if (!(currentSection in result)) {
        result[currentSection] = {};
      }
      continue;
    }

    // Key-value pair: key = "value" or key = value
    const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)(\s*)=(\s*)(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1]!;
      let value = kvMatch[4]!.trim();

      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
        // Handle basic escape sequences in double-quoted strings
        if (kvMatch[4]!.trim().startsWith('"')) {
          value = value
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\\\/g, "\\")
            .replace(/\\"/g, '"');
        }
      }

      if (currentSection) {
        const section = result[currentSection];
        if (typeof section === "object") {
          section[key] = value;
        }
      } else {
        result[key] = value;
      }
      continue;
    }
  }

  return result;
}

/**
 * Serialize a flat config object to TOML format.
 */
function serializeTOML(config: Record<string, string>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(config)) {
    lines.push(`${key} = "${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  }
  return lines.join("\n") + "\n";
}

/**
 * Ensure the config directory exists.
 */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load the CLI config from disk.
 */
export function loadConfig(): CliConfig | null {
  if (!existsSync(CONFIG_FILE)) {
    return null;
  }

  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    const parsed = parseTOML(raw);

    const apiUrl = parsed["api_url"];
    const token = parsed["token"];

    if (typeof apiUrl === "string" && typeof token === "string") {
      return { api_url: apiUrl, token };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Save the CLI config to disk.
 */
export function saveConfig(config: CliConfig): void {
  ensureConfigDir();
  writeFileSync(
    CONFIG_FILE,
    serializeTOML({
      api_url: config.api_url,
      token: config.token,
    }),
    { mode: 0o600 },
  );
}

/**
 * Remove the CLI config file.
 */
export function removeConfig(): boolean {
  if (existsSync(CONFIG_FILE)) {
    unlinkSync(CONFIG_FILE);
    return true;
  }
  return false;
}

/**
 * Get config or exit with error if not logged in.
 */
export function requireConfig(): CliConfig {
  const config = loadConfig();
  if (!config) {
    process.stdout.write(
      "\x1b[31m✗\x1b[0m Not logged in. Run \x1b[1mdigi login\x1b[0m first.\n",
    );
    process.exit(1);
  }
  return config;
}
