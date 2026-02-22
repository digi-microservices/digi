"use client";

import { useEffect, useState } from "react";
import { graphqlClient } from "~/lib/graphql";
import { DataTable } from "~/components/data-table";
import type { Server } from "../servers/page";

interface VM {
  id: string;
  name: string;
  ipAddress: string;
  status: string;
  cpuCores: number;
  memoryMb: number;
  diskGb: number;
  containerCount: number;
  serverId: string;
}

export default function VmsPage() {
  const [vms, setVms] = useState<VM[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  function handleProvision(serverId: string) {
    if (loading) return;
    graphqlClient<{ provisionVm: VM }>(
      `
      mutation($serverId: String!, $vmName: String!) {
        provisionVm(serverId: $serverId, vmName: $vmName) {
          id
          name
          ipAddress
          status
          cpuCores
          memoryMb
          diskGb
          containerCount
        }
      }
    `,
      { serverId, vmName: `vm-${Date.now()}` },
    )
      .then((res) => {
        console.log(res);
        if (res.provisionVm) {
          setVms((prev) => [...prev, res.provisionVm]);
        }
      })
      .catch(console.error);
  }

  async function fetchServers() {
    const res = await graphqlClient<{ servers: Server[] }>(`
      query { servers { id hostname region status maxVms vmCount name } }
    `);

    if (res.servers) setServers(res.servers);
  }

  useEffect(() => {
    fetchServers();
    graphqlClient<{ vms: VM[] }>(`
      query { vms { id name ipAddress status cpuCores memoryMb diskGb containerCount serverId } }
    `)
      .then((res) => {
        if (res.vms) setVms(res.vms);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-2xl font-bold text-white">Virtual Machines</h1>
        <button
          onClick={() => handleProvision(servers[0]?.id || "")}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          Provison VM
        </button>
      </div>
      <DataTable
        columns={[
          "Name",
          "IP",
          "Server",
          "Status",
          "CPU",
          "Memory",
          "Disk",
          "Containers",
        ]}
        rows={vms.map((vm) => [
          vm.name,
          <code key={vm.id} className="text-xs">
            {vm.ipAddress}
          </code>,
          servers.find((s) => s.id === vm.serverId)?.name || vm.serverId,
          <span
            key={`s-${vm.id}`}
            className={
              vm.status === "running" ? "text-green-400" : "text-yellow-400"
            }
          >
            {vm.status}
          </span>,
          `${vm.cpuCores} cores`,
          `${vm.memoryMb} MB`,
          `${vm.diskGb} GB`,
          String(vm.containerCount),
        ])}
      />
    </div>
  );
}
