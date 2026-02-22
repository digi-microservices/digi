"use client";

import { useEffect, useState } from "react";
import { graphqlClient } from "~/lib/graphql";
import { StatCard } from "~/components/stat-card";
import { MonthlyRevenueChart, DailyRevenueChart } from "~/components/revenue-chart";

interface BillingStats {
  mrr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  monthlyRevenue: { month: string; revenue: number }[];
  dailyRevenue: { date: string; revenue: number }[];
}

export default function BillingPage() {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    graphqlClient<{ billingStats: BillingStats }>(`
      query {
        billingStats {
          mrr totalRevenue activeSubscriptions churnRate
          monthlyRevenue { month revenue }
          dailyRevenue { date revenue }
        }
      }
    `)
      .then((res) => {
        if (res.billingStats) setStats(res.billingStats);
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
      <h1 className="mb-6 text-2xl font-bold text-white">Billing</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="MRR" value={`£${((stats?.mrr ?? 0) / 100).toFixed(2)}`} />
        <StatCard label="Total Revenue" value={`£${((stats?.totalRevenue ?? 0) / 100).toFixed(2)}`} />
        <StatCard label="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} />
        <StatCard label="Churn Rate" value={`${(stats?.churnRate ?? 0).toFixed(1)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyRevenueChart data={stats?.monthlyRevenue ?? []} />
        <DailyRevenueChart data={stats?.dailyRevenue ?? []} />
      </div>
    </div>
  );
}
