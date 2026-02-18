import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { mutate } from "../lib/api.js";
import { colors, success, error, info, warning, log, newline, spinner } from "../lib/output.js";

interface DeployServiceResponse {
  deployService: {
    id: string;
    status: string;
    url?: string;
  };
}

interface TomlService {
  name: string;
  [key: string]: string;
}

/**
 * Minimal TOML parser for digi.toml deploy config.
 * Supports [section] headers and key = "value" pairs.
 */
function parseDigiToml(content: string): Record<string, TomlService> {
  const services: Record<string, TomlService> = {};
  let currentSection: string | null = null;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1]!;
      if (!services[currentSection]) {
        services[currentSection] = { name: currentSection };
      }
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)(\s*)=(\s*)(.+)$/);
    if (kvMatch && currentSection) {
      const key = kvMatch[1]!;
      let value = kvMatch[4]!.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      const section = services[currentSection];
      if (section) {
        section[key] = value;
      }
    }
  }

  return services;
}

export async function deployCommand(args: string[]): Promise<void> {
  const tomlPath = join(process.cwd(), "digi.toml");

  if (!existsSync(tomlPath)) {
    error("No digi.toml found in the current directory.");
    newline();
    log(`  Create one with ${colors.bold("digi init <name>")}`);
    newline();
    process.exit(1);
  }

  // Parse --only flag
  let onlyComponents: string[] | null = null;
  const onlyIndex = args.indexOf("--only");
  if (onlyIndex !== -1) {
    const onlyValue = args[onlyIndex + 1];
    if (!onlyValue) {
      error("--only flag requires a comma-separated list of components.");
      process.exit(1);
    }
    onlyComponents = onlyValue.split(",").map((c) => c.trim()).filter(Boolean);
  }

  const raw = readFileSync(tomlPath, "utf-8");
  const services = parseDigiToml(raw);
  const serviceNames = Object.keys(services);

  if (serviceNames.length === 0) {
    error("No services defined in digi.toml.");
    process.exit(1);
  }

  const toDeploy = onlyComponents
    ? serviceNames.filter((name) => onlyComponents!.includes(name))
    : serviceNames;

  if (toDeploy.length === 0) {
    warning("No matching components found for --only filter.");
    log(`  Available components: ${serviceNames.join(", ")}`);
    process.exit(1);
  }

  newline();
  log(`  ${colors.bold("Deploying from digi.toml...")}`);
  newline();

  const results: Array<{ name: string; ok: boolean; url?: string; time: number }> = [];

  for (const name of toDeploy) {
    const service = services[name];
    if (!service) continue;

    const start = performance.now();
    const spin = spinner(`Deploying ${colors.bold(name)}...`);

    try {
      const data = await mutate<DeployServiceResponse>(
        `mutation DeployService($input: DeployServiceInput!) {
          deployService(input: $input) { id status }
        }`,
        {
          input: {
            name: service.name,
            sourceType: service.source_type ?? "github",
            repoUrl: service.repo_url ?? null,
            dockerImage: service.docker_image ?? null,
          },
        },
      );

      const elapsed = ((performance.now() - start) / 1000).toFixed(1);
      spin.stop(undefined);

      const statusLabel = data.deployService.status === "queued" ? "deployed" : data.deployService.status;
      success(`${colors.bold(name).padEnd(20)} — ${statusLabel} (${elapsed}s)`);
      results.push({ name, ok: true, url: data.deployService.url, time: Number(elapsed) });
    } catch (err) {
      const elapsed = ((performance.now() - start) / 1000).toFixed(1);
      spin.stop(undefined);
      error(
        `${colors.bold(name).padEnd(20)} — failed (${elapsed}s): ${err instanceof Error ? err.message : String(err)}`,
      );
      results.push({ name, ok: false, time: Number(elapsed) });
    }
  }

  newline();

  const allOk = results.every((r) => r.ok);
  if (allOk) {
    success("All services deployed successfully.");
  } else {
    const failed = results.filter((r) => !r.ok).map((r) => r.name);
    warning(`Some services failed to deploy: ${failed.join(", ")}`);
  }

  // Show URLs for successful deployments
  const withUrls = results.filter((r) => r.ok && r.url);
  if (withUrls.length > 0) {
    newline();
    for (const r of withUrls) {
      info(`${r.name} → ${colors.blue(r.url!)}`);
    }
  }

  newline();
}
