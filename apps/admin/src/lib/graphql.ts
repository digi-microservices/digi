import { env } from "~/env";

const API_URL = env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

export async function graphqlClient<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<GraphQLResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  return response.json() as Promise<GraphQLResponse<T>>;
}
