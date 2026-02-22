"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { graphqlClient } from "~/lib/graphql";
import { DataTable } from "~/components/data-table";
import { Modal } from "~/components/modal";
import { Input } from "@digi/ui";

export interface Server {
  id: string;
  hostname: string;
  region: string;
  status: string;
  maxVms: number;
  vmCount: number;
  name: string;
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    hostname: "",
    port: "8006",
    tokenId: "",
    tokenSecret: "",
    region: "",
    maxVms: "10",
    name: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function fetchServers() {
    const res = await graphqlClient<{ servers: Server[] }>(`
      query { servers { id hostname region status maxVms vmCount name } }
    `);

    if (res.servers) setServers(res.servers);
  }

  useEffect(() => {
    fetchServers().finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    setSubmitting(true);
    try {
      const res = await graphqlClient(
        `
        mutation AddNode($input: AddProxmoxNodeInput!) {
          addProxmoxNode(input: $input) { id }
        }
      `,
        {
          input: {
            hostname: form.hostname,
            port: parseInt(form.port),
            apiTokenId: form.tokenId,
            apiTokenSecret: form.tokenSecret,
            region: form.region || null,
            name: form.name,
            maxVms: parseInt(form.maxVms),
          },
        },
      );

      //@ts-ignore
      if (res.errors?.[0]) {
        //@ts-ignore
        toast.error(res.errors[0].message);
      } else {
        toast.success("Proxmox node added");
        setShowAdd(false);
        setForm({
          hostname: "",
          port: "8006",
          tokenId: "",
          tokenSecret: "",
          region: "",
          maxVms: "10",
          name: "",
        });
        await fetchServers();
      }
    } catch {
      toast.error("Failed to add node");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this Proxmox node?")) return;
    try {
      await graphqlClient(`mutation($id: ID!) { removeProxmoxNode(id: $id) }`, {
        id,
      });
      toast.success("Node removed");
      await fetchServers();
    } catch {
      toast.error("Failed to remove node");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Proxmox Nodes</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          Add Node
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <DataTable
          columns={["Hostname", "Region", "Status", "VMs", "Max VMs", ""]}
          rows={servers.map((s) => [
            s.hostname,
            s.region || "—",
            <span
              key={s.id}
              className={
                s.status === "active" ? "text-green-400" : "text-yellow-400"
              }
            >
              {s.status}
            </span>,
            String(s.vmCount),
            String(s.maxVms),
            <button
              key={`rm-${s.id}`}
              onClick={() => handleRemove(s.id)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remove
            </button>,
          ])}
        />
      )}

      {showAdd && (
        <Modal title="Add Proxmox Node" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <Input
              placeholder="Server Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
            />
            <Input
              placeholder="Hostname"
              value={form.hostname}
              onChange={(e) => setForm({ ...form, hostname: e.target.value })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
            />
            <Input
              placeholder="Port"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: e.target.value })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
            />
            <Input
              placeholder="API Token ID"
              value={form.tokenId}
              onChange={(e) => setForm({ ...form, tokenId: e.target.value })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
            />
            <Input
              placeholder="API Token Secret"
              type="password"
              value={form.tokenSecret}
              onChange={(e) =>
                setForm({ ...form, tokenSecret: e.target.value })
              }
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
            />
            <Input
              placeholder="Region (optional)"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
            />
            <Input
              placeholder="Max VMs"
              value={form.maxVms}
              onChange={(e) => setForm({ ...form, maxVms: e.target.value })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
            />
            <button
              onClick={handleAdd}
              disabled={
                submitting ||
                !form.hostname ||
                !form.tokenId ||
                !form.tokenSecret
              }
              className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Node"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
