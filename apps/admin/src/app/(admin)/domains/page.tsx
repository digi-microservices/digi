"use client";

import { useEffect, useState } from "react";
import { graphqlClient } from "~/lib/graphql";
import { DataTable } from "~/components/data-table";
import { Modal } from "~/components/modal";

interface Domain {
  id: string;
  domain: string;
  isDefault: boolean;
  serviceCount: number;
  createdAt: string;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchDomains() {
    const res = await graphqlClient<{ domains: Domain[] }>(`
      query { domains { id domain isDefault serviceCount createdAt } }
    `);
    if (res.data) setDomains(res.data.domains);
  }

  useEffect(() => {
    fetchDomains().finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    setSubmitting(true);
    try {
      await graphqlClient(`
        mutation($domain: String!, $zoneId: String!) { addDomain(domain: $domain, cloudflareZoneId: $zoneId) { id } }
      `, { domain: newDomain, zoneId });
      setShowAdd(false);
      setNewDomain("");
      setZoneId("");
      await fetchDomains();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetDefault(id: string) {
    await graphqlClient(`mutation($id: ID!) { setDomainDefault(id: $id) { id } }`, { id });
    await fetchDomains();
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this domain?")) return;
    await graphqlClient(`mutation($id: ID!) { removeDomain(id: $id) }`, { id });
    await fetchDomains();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Platform Domains</h1>
        <button onClick={() => setShowAdd(true)} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          Add Domain
        </button>
      </div>

      <DataTable
        columns={["Domain", "Default", "Services", "Added", ""]}
        rows={domains.map((d) => [
          d.domain,
          d.isDefault ? <span key={d.id} className="text-green-400">Yes</span> : <span key={d.id} className="text-neutral-500">No</span>,
          String(d.serviceCount),
          new Date(d.createdAt).toLocaleDateString(),
          <div key={`a-${d.id}`} className="flex gap-2">
            {!d.isDefault && (
              <button onClick={() => handleSetDefault(d.id)} className="text-xs text-blue-400 hover:text-blue-300">Set default</button>
            )}
            <button onClick={() => handleRemove(d.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
          </div>,
        ])}
      />

      {showAdd && (
        <Modal title="Add Platform Domain" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <input placeholder="domain.tld" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white" />
            <input placeholder="Cloudflare Zone ID" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white" />
            <button onClick={handleAdd} disabled={submitting || !newDomain || !zoneId} className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
              {submitting ? "Adding..." : "Add Domain"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
