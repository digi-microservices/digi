import { query, mutate } from "../lib/api.js";
import {
  colors,
  success,
  error,
  info,
  log,
  newline,
  table,
  spinner,
} from "../lib/output.js";
import { prompt, confirm, select } from "../lib/prompt.js";

// --- GraphQL response types ---

interface Service {
  id: string;
  name: string;
  status: string;
  subdomain: string;
  createdAt: string;
}

interface ServiceDetail {
  id: string;
  name: string;
  status: string;
  subdomain: string;
  sourceType: string;
  repoUrl: string | null;
  dockerImage: string | null;
  createdAt: string;
  containers: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
  }>;
  deployments: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

interface ListServicesResponse {
  services: Service[];
}

interface ServiceResponse {
  service: ServiceDetail;
}

interface CreateServiceResponse {
  createService: { id: string; name: string };
}

interface DeleteServiceResponse {
  deleteService: { id: string };
}

// --- Subcommands ---

async function listServices(): Promise<void> {
  const spin = spinner("Fetching services...");

  try {
    const data = await query<ListServicesResponse>(
      `query { services { id name status subdomain createdAt } }`,
    );

    spin.stop();

    if (data.services.length === 0) {
      info("No services found. Create one with " + colors.bold("digi services create"));
      return;
    }

    newline();
    table(
      ["NAME", "STATUS", "SUBDOMAIN", "CREATED"],
      data.services.map((s) => [
        s.name,
        formatStatus(s.status),
        s.subdomain,
        formatDate(s.createdAt),
      ]),
    );
    newline();
  } catch (err) {
    spin.stop();
    error(`Failed to list services: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function createService(): Promise<void> {
  newline();
  log(`  ${colors.bold("Create a new service")}`);
  newline();

  const name = await prompt("Service name", { required: true });

  newline();
  const sourceType = await select("Source type:", [
    "GitHub repository",
    "Docker image",
  ]);

  const isGithub = sourceType.startsWith("GitHub");
  newline();

  let repoUrl: string | null = null;
  let dockerImage: string | null = null;

  if (isGithub) {
    repoUrl = await prompt("Repository URL", { required: true });
  } else {
    dockerImage = await prompt("Docker image", { required: true });
  }

  // Component selection
  newline();
  log(`  ${colors.bold("Components to include:")}`);
  newline();
  const components: string[] = ["app"];

  const addPostgres = await confirm("  Add PostgreSQL?", false);
  if (addPostgres) components.push("postgres");

  const addRedis = await confirm("  Add Redis?", false);
  if (addRedis) components.push("redis");

  newline();

  if (isGithub) {
    const port = await prompt("Port", { default: "3000" });
    // Port is informational for the user — sent as part of the service config
    void port;
  }

  const spin = spinner("Creating service...");

  try {
    const data = await mutate<CreateServiceResponse>(
      `mutation CreateService($input: CreateServiceInput!) {
        createService(input: $input) { id name }
      }`,
      {
        input: {
          name,
          sourceType: isGithub ? "github" : "docker",
          repoUrl,
          dockerImage,
          components,
        },
      },
    );

    spin.stop(undefined);
    newline();
    success(`Service ${colors.bold(data.createService.name)} created`);
    success(`Containers: ${components.join(", ")}`);
    info(`Deploy with: ${colors.bold("digi deploy")}`);
    newline();
  } catch (err) {
    spin.stop();
    error(`Failed to create service: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function deleteService(id: string): Promise<void> {
  if (!id) {
    error("Service ID is required. Usage: digi services delete <id>");
    process.exit(1);
  }

  const confirmed = await confirm(
    `${colors.yellow("⚠")} Are you sure you want to delete service ${colors.bold(id)}?`,
    false,
  );

  if (!confirmed) {
    info("Cancelled.");
    return;
  }

  const spin = spinner("Deleting service...");

  try {
    await mutate<DeleteServiceResponse>(
      `mutation DeleteService($id: ID!) {
        deleteService(id: $id) { id }
      }`,
      { id },
    );

    spin.stop(undefined);
    success(`Service ${colors.bold(id)} deleted.`);
  } catch (err) {
    spin.stop();
    error(`Failed to delete service: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function serviceInfo(id: string): Promise<void> {
  if (!id) {
    error("Service ID is required. Usage: digi services info <id>");
    process.exit(1);
  }

  const spin = spinner("Fetching service details...");

  try {
    const data = await query<ServiceResponse>(
      `query Service($id: ID!) {
        service(id: $id) {
          id name status subdomain sourceType repoUrl dockerImage createdAt
          containers { id name type status }
          deployments { id status createdAt }
        }
      }`,
      { id },
    );

    spin.stop();
    const s = data.service;

    newline();
    log(`  ${colors.bold("Name:")}        ${s.name}`);
    log(`  ${colors.bold("ID:")}          ${colors.dim(s.id)}`);
    log(`  ${colors.bold("Status:")}      ${formatStatus(s.status)}`);
    log(`  ${colors.bold("Subdomain:")}   ${s.subdomain}`);
    log(`  ${colors.bold("Source:")}      ${s.sourceType}${s.repoUrl ? ` (${s.repoUrl})` : ""}${s.dockerImage ? ` (${s.dockerImage})` : ""}`);
    log(`  ${colors.bold("Created:")}     ${formatDate(s.createdAt)}`);

    if (s.containers.length > 0) {
      newline();
      log(`  ${colors.bold("Containers:")}`);
      table(
        ["NAME", "TYPE", "STATUS"],
        s.containers.map((c) => [c.name, c.type, formatStatus(c.status)]),
      );
    }

    if (s.deployments.length > 0) {
      newline();
      log(`  ${colors.bold("Recent Deployments:")}`);
      table(
        ["ID", "STATUS", "CREATED"],
        s.deployments.slice(0, 5).map((d) => [
          d.id.slice(0, 8),
          formatStatus(d.status),
          formatDate(d.createdAt),
        ]),
      );
    }

    newline();
  } catch (err) {
    spin.stop();
    error(`Failed to fetch service info: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

// --- Helpers ---

function formatStatus(status: string): string {
  switch (status) {
    case "running":
    case "live":
      return colors.green(status);
    case "deploying":
    case "building":
    case "creating":
    case "queued":
    case "pending":
      return colors.yellow(status);
    case "error":
    case "failed":
      return colors.red(status);
    case "stopped":
    case "destroying":
      return colors.dim(status);
    default:
      return status;
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// --- Router ---

export async function servicesCommand(args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case "list":
    case undefined:
      await listServices();
      break;
    case "create":
      await createService();
      break;
    case "delete":
      await deleteService(args[1] ?? "");
      break;
    case "info":
      await serviceInfo(args[1] ?? "");
      break;
    default:
      error(`Unknown subcommand: ${subcommand}`);
      log("\nUsage: digi services <list|create|delete|info>");
      process.exit(1);
  }
}
