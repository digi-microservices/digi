import { type DigiClient } from "./client";
import { type EnvVar } from "./types";

export class EnvAPI {
  constructor(private readonly client: DigiClient) {}

  async list(serviceId: string): Promise<EnvVar[]> {
    const data = await this.client.graphql<{ serviceEnvVars: EnvVar[] }>(
      `
      query($serviceId: ID!) {
        serviceEnvVars(serviceId: $serviceId) {
          key value
        }
      }
    `,
      { serviceId },
    );
    return data.serviceEnvVars;
  }

  async set(serviceId: string, vars: EnvVar[]): Promise<void> {
    await this.client.graphql<{ setServiceEnvVars: boolean }>(
      `
      mutation($serviceId: ID!, $vars: [EnvVarInput!]!) {
        setServiceEnvVars(serviceId: $serviceId, vars: $vars)
      }
    `,
      { serviceId, vars },
    );
  }

  async delete(serviceId: string, key: string): Promise<void> {
    await this.client.graphql<{ deleteServiceEnvVar: boolean }>(
      `
      mutation($serviceId: ID!, $key: String!) {
        deleteServiceEnvVar(serviceId: $serviceId, key: $key)
      }
    `,
      { serviceId, key },
    );
  }
}
