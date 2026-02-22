import { type DigiClient } from "./client";
import { type Domain } from "./types";

export class DomainsAPI {
  constructor(private readonly client: DigiClient) {}

  async list(serviceId?: string): Promise<Domain[]> {
    const data = await this.client.graphql<{ domains: Domain[] }>(
      `
      query($serviceId: ID) {
        customDomains(serviceId: $serviceId) {
          id serviceId hostname verified createdAt
        }
      }
    `,
      { serviceId },
    );
    return data.domains;
  }

  async add(serviceId: string, hostname: string): Promise<Domain> {
    const data = await this.client.graphql<{ addCustomDomain: Domain }>(
      `
      mutation($serviceId: ID!, $hostname: String!) {
        addCustomDomain(serviceId: $serviceId, hostname: $hostname) {
          id serviceId hostname verified createdAt
        }
      }
    `,
      { serviceId, hostname },
    );
    return data.addCustomDomain;
  }

  async remove(id: string): Promise<void> {
    await this.client.graphql<{ removeCustomDomain: boolean }>(
      `
      mutation($id: ID!) {
        removeCustomDomain(id: $id)
      }
    `,
      { id },
    );
  }
}
