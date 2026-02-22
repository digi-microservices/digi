import { type DigiClientConfig } from "./types";
import { ServicesAPI } from "./services";
import { DeploymentsAPI } from "./deployments";
import { DomainsAPI } from "./domains";
import { EnvAPI } from "./env";

export class DigiSDKError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "DigiSDKError";
  }
}

export class DigiClient {
  readonly #config: DigiClientConfig;

  constructor(config: DigiClientConfig) {
    if (!config.apiUrl) throw new DigiSDKError("apiUrl is required");
    if (!config.token) throw new DigiSDKError("token is required");
    this.#config = {
      apiUrl: config.apiUrl.replace(/\/$/, ""),
      token: config.token,
    };
  }

  async graphql<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(`${this.#config.apiUrl}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.#config.token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new DigiSDKError(
        `HTTP ${res.status}: ${res.statusText}`,
        `HTTP_${res.status}`,
      );
    }

    const json = (await res.json()) as {
      data?: T;
      errors?: { message: string; extensions?: { code?: string } }[];
    };

    if (json.errors && json.errors.length > 0) {
      const err = json.errors[0]!;
      throw new DigiSDKError(err.message, err.extensions?.code);
    }

    return json.data as T;
  }

  get services(): ServicesAPI {
    return new ServicesAPI(this);
  }

  get deployments(): DeploymentsAPI {
    return new DeploymentsAPI(this);
  }

  get domains(): DomainsAPI {
    return new DomainsAPI(this);
  }

  get env(): EnvAPI {
    return new EnvAPI(this);
  }
}
