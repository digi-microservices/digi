"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

interface DailyRevenueData {
  date: string;
  revenue: number;
}

export function MonthlyRevenueChart({
  data,
}: {
  data: MonthlyRevenueData[];
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-neutral-900 p-5">
      <h3 className="mb-4 text-sm font-medium text-neutral-400">
        Monthly Revenue
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#737373", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
            />
            <YAxis
              tick={{ fill: "#737373", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#171717",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
            />
            <Bar dataKey="revenue" fill="#3A7DFF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DailyRevenueChart({
  data,
}: {
  data: DailyRevenueData[];
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-neutral-900 p-5">
      <h3 className="mb-4 text-sm font-medium text-neutral-400">
        Daily Revenue (Last 30 Days)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#737373", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
            />
            <YAxis
              tick={{ fill: "#737373", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#171717",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3A7DFF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#3A7DFF" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
