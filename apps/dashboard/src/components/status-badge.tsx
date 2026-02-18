const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  running: {
    label: "Running",
    color: "border-green-500/30 bg-green-500/10 text-green-400",
    dot: "bg-green-400",
  },
  deploying: {
    label: "Deploying",
    color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    dot: "bg-yellow-400",
  },
  error: {
    label: "Error",
    color: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-400",
  },
  stopped: {
    label: "Stopped",
    color: "border-neutral-500/30 bg-neutral-500/10 text-neutral-400",
    dot: "bg-neutral-400",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status.toLowerCase()] ?? statusConfig.stopped!;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
