import { query, mutate } from "../lib/api.js";
import { colors, success, error, log, newline, table, spinner } from "../lib/output.js";

interface Domain {
  id: string;
  domain: string;
  serviceId: string;
  serviceName: string;
  verified: boolean;
  createdAt: string;
}

interface ListDomainsResponse {
  domains: Domain[];
}

interface AddDomainResponse {
  addDomain: {
    id: string;
    domain: string;
    verified: boolean;
  };
}

async function listDomains(): Promise<void> {
  const spin = spinner("Fetching domains...");

  try {
    const data = await query<ListDomainsResponse>(
      `query { domains { id domain serviceId serviceName verified createdAt } }`,
    );

    spin.stop();

    if (data.domains.length === 0) {
      log("\nNo custom domains configured.");
      log(`Use ${colors.bold("digi domains add <serviceId> <domain>")} to add one.`);
      return;
    }

    newline();
    table(
      ["DOMAIN", "SERVICE", "VERIFIED", "CREATED"],
      data.domains.map((d) => [
        d.domain,
        d.serviceName,
        d.verified ? colors.green("yes") : colors.yellow("pending"),
        formatDate(d.createdAt),
      ]),
    );
    newline();
  } catch (err) {
    spin.stop();
    error(`Failed to list domains: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function addDomain(serviceId: string, domain: string): Promise<void> {
  if (!serviceId || !domain) {
    error("Usage: digi domains add <serviceId> <domain>");
    process.exit(1);
  }

  const spin = spinner(`Adding domain ${colors.bold(domain)}...`);

  try {
    const data = await mutate<AddDomainResponse>(
      `mutation AddDomain($serviceId: ID!, $domain: String!) {
        addDomain(serviceId: $serviceId, domain: $domain) { id domain verified }
      }`,
      { serviceId, domain },
    );

    spin.stop(undefined);
    success(`Domain ${colors.bold(data.addDomain.domain)} added.`);

    if (!data.addDomain.verified) {
      log(
        `\n  ${colors.yellow("⚠")} Domain is not yet verified. Add a CNAME record pointing to your Digi subdomain.`,
      );
    }
  } catch (err) {
    spin.stop();
    error(`Failed to add domain: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function domainsCommand(args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case "list":
    case undefined:
      await listDomains();
      break;
    case "add":
      await addDomain(args[1] ?? "", args[2] ?? "");
      break;
    default:
      error(`Unknown subcommand: ${subcommand}`);
      log("\nUsage: digi domains <list|add>");
      process.exit(1);
  }
}
