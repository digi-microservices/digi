"use client";

import { Input } from "@digi/ui";
import { useEffect, useState } from "react";
import { gql } from "~/lib/graphql";

interface ApiToken {
  id: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchTokens() {
    const data = await gql<{ apiTokens: ApiToken[] }>(`
      query { apiTokens { id name lastUsedAt createdAt } }
    `);
    setTokens(data.apiTokens);
  }

  useEffect(() => {
    fetchTokens().finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const data = await gql<{ generateApiToken: { token: string } }>(`
        mutation($name: String!) { generateApiToken(name: $name) { token } }
      `, { name: newName });
      setNewToken(data.generateApiToken.token);
      setNewName("");
      await fetchTokens();
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API token?")) return;
    await gql(`mutation($id: String!) { revokeApiToken(id: $id) }`, { id });
    await fetchTokens();
  }

  function handleCopy() {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-white">API Tokens</h1>

      {/* New token display */}
      {newToken && (
        <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <p className="mb-2 text-sm font-medium text-green-400">
            Token created! Copy it now — it won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-black/50 px-3 py-2 text-xs text-white">{newToken}</code>
            <button onClick={handleCopy} className="shrink-0 rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-400 hover:text-white">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Create token */}
      <section className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Create Token</h2>
        <div className="flex-col gap-4 w-full">
          <Input
            placeholder="Token name (e.g. CI/CD)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="rounded-lg mt-2 bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </section>

      {/* Token list */}
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Active Tokens</h2>
        {tokens.length === 0 ? (
          <p className="text-sm text-neutral-500">No API tokens yet.</p>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between rounded-lg border border-white/[0.08] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{token.name}</p>
                  <p className="text-xs text-neutral-500">
                    Created {new Date(token.createdAt).toLocaleDateString()}
                    {token.lastUsedAt && ` · Last used ${new Date(token.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(token.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
