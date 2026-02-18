"use client";

import { useEffect, useState } from "react";
import { graphqlClient } from "~/lib/graphql";
import { StatCard } from "~/components/stat-card";
import { MonthlyRevenueChart } from "~/components/revenue-chart";

interface OverviewStats {
  totalUsers: number;
  totalServices: number;
  totalServers: number;
  totalVms: number;
  activeServices: number;
  mrr: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    graphqlClient<{ adminOverview: OverviewStats }>(`
      query AdminOverview {
        adminOverview {
          totalUsers
          totalServices
          totalServers
          totalVms
          activeServices
          mrr
        }
      }
    `)
      .then((res) => {
        if (res.data) setStats(res.data.adminOverview);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Overview</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} />
        <StatCard label="Active Services" value={stats?.activeServices ?? 0} />
        <StatCard label="Total Services" value={stats?.totalServices ?? 0} />
        <StatCard label="Proxmox Nodes" value={stats?.totalServers ?? 0} />
        <StatCard label="Virtual Machines" value={stats?.totalVms ?? 0} />
        <StatCard
          label="MRR"
          value={`£${((stats?.mrr ?? 0) / 100).toFixed(2)}`}
        />
      </div>

      <MonthlyRevenueChart data={[]} />
    </div>
  );
}
