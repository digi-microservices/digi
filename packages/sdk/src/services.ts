import { type DigiClient } from "./client";
import {
  type Service,
  type Deployment,
  type CreateServiceInput,
} from "./types";

export class ServicesAPI {
  constructor(private readonly client: DigiClient) {}

  async list(): Promise<Service[]> {
    const data = await this.client.graphql<{ services: Service[] }>(`
      query {
        services {
          id name status repoUrl dockerImage domain createdAt updatedAt
        }
      }
    `);
    return data.services;
  }

  async get(id: string): Promise<Service> {
    const data = await this.client.graphql<{ service: Service }>(
      `
      query($id: ID!) {
        service(id: $id) {
          id name status repoUrl dockerImage domain createdAt updatedAt
        }
      }
    `,
      { id },
    );
    return data.service;
  }

  async create(input: CreateServiceInput): Promise<Service> {
    const data = await this.client.graphql<{ createService: Service }>(
      `
      mutation($input: CreateServiceInput!) {
        createService(input: $input) {
          id name status repoUrl dockerImage domain createdAt updatedAt
        }
      }
    `,
      { input },
    );
    return data.createService;
  }

  async delete(id: string): Promise<void> {
    await this.client.graphql<{ deleteService: boolean }>(
      `
      mutation($id: ID!) {
        deleteService(id: $id)
      }
    `,
      { id },
    );
  }

  async deploy(id: string): Promise<Deployment> {
    const data = await this.client.graphql<{ deployService: Deployment }>(
      `
      mutation($id: ID!) {
        deployService(serviceId: $id) {
          id serviceId status commitSha createdAt
        }
      }
    `,
      { id },
    );
    return data.deployService;
  }
}
