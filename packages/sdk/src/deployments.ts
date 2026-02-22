import { type DigiClient } from "./client";
import { type Deployment } from "./types";

export class DeploymentsAPI {
  constructor(private readonly client: DigiClient) {}

  async list(serviceId?: string): Promise<Deployment[]> {
    const data = await this.client.graphql<{ deployments: Deployment[] }>(
      `
      query($serviceId: ID) {
        deployments(serviceId: $serviceId) {
          id serviceId status commitSha commitMessage createdAt finishedAt
        }
      }
    `,
      { serviceId },
    );
    return data.deployments;
  }

  async get(id: string): Promise<Deployment> {
    const data = await this.client.graphql<{ deployment: Deployment }>(
      `
      query($id: ID!) {
        deployment(id: $id) {
          id serviceId status commitSha commitMessage createdAt finishedAt logs
        }
      }
    `,
      { id },
    );
    return data.deployment;
  }

  async cancel(id: string): Promise<void> {
    await this.client.graphql<{ cancelDeployment: boolean }>(
      `
      mutation($id: ID!) {
        cancelDeployment(id: $id)
      }
    `,
      { id },
    );
  }
}
