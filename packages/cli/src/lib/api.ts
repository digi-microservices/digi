import { type CliConfig, requireConfig } from "./config";

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

/**
 * Execute a GraphQL query against the API.
 */
export async function query<T = unknown>(
  queryString: string,
  variables?: Record<string, unknown>,
  configOverride?: CliConfig,
): Promise<T> {
  const config = configOverride ?? requireConfig();

  const response = await fetch(`${config.api_url}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      query: queryString,
      variables: variables ?? {},
    }),
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join(", ");
    throw new Error(`GraphQL error: ${messages}`);
  }

  if (!json.data) {
    throw new Error("No data returned from API");
  }

  return json.data;
}

/**
 * Execute a GraphQL mutation against the API.
 */
export async function mutate<T = unknown>(
  mutationString: string,
  variables?: Record<string, unknown>,
  configOverride?: CliConfig,
): Promise<T> {
  return query<T>(mutationString, variables, configOverride);
}
