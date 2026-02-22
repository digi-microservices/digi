"use client";

import { useEffect, useState } from "react";
import { graphqlClient } from "~/lib/graphql";
import { DataTable } from "~/components/data-table";

interface AuditLog {
  id: string;
  actorId: string;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    graphqlClient<{ auditLogs: AuditLog[] }>(`
      query { auditLogs { id actorId actorType action resourceType resourceId ipAddress createdAt } }
    `)
      .then((res) => {
        if (res.auditLogs) setLogs(res.auditLogs);
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
      <h1 className="mb-6 text-2xl font-bold text-white">Audit Log</h1>
      <DataTable
        columns={["Time", "Actor", "Action", "Resource", "IP"]}
        rows={logs.map((log) => [
          new Date(log.createdAt).toLocaleString(),
          `${log.actorType}:${log.actorId.slice(0, 8)}`,
          log.action,
          log.resourceId ? `${log.resourceType}:${log.resourceId.slice(0, 8)}` : log.resourceType,
          log.ipAddress ?? "—",
        ])}
      />
    </div>
  );
}
