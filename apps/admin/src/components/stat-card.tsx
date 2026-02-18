import { type ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatCard({
  label,
  value,
  icon,
  change,
  changeType = "neutral",
}: StatCardProps) {
  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-neutral-500",
  };

  return (
    <div className="rounded-xl border border-white/5 bg-neutral-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>
          {change && (
            <p className={`mt-1 text-xs ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-white/5 p-2 text-neutral-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
