"use client";

import { useEffect, useState } from "react";
import { graphqlClient } from "~/lib/graphql";
import { DataTable } from "~/components/data-table";

interface VM {
  id: string;
  name: string;
  ipAddress: string;
  status: string;
  cpuCores: number;
  memoryMb: number;
  diskGb: number;
  containerCount: number;
  server: { hostname: string };
}

export default function VmsPage() {
  const [vms, setVms] = useState<VM[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    graphqlClient<{ vms: VM[] }>(`
      query { vms { id name ipAddress status cpuCores memoryMb diskGb containerCount server { hostname } } }
    `)
      .then((res) => {
        if (res.data) setVms(res.data.vms);
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
      <h1 className="mb-6 text-2xl font-bold text-white">Virtual Machines</h1>
      <DataTable
        columns={["Name", "IP", "Server", "Status", "CPU", "Memory", "Disk", "Containers"]}
        rows={vms.map((vm) => [
          vm.name,
          <code key={vm.id} className="text-xs">{vm.ipAddress}</code>,
          vm.server.hostname,
          <span key={`s-${vm.id}`} className={vm.status === "running" ? "text-green-400" : "text-yellow-400"}>
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
