import Link from "next/link";
import { StatusBadge } from "~/components/status-badge";

interface ServiceCardProps {
  id: string;
  name: string;
  status: string;
  subdomain: string;
  createdAt: string;
}

export function ServiceCard({ id, name, status, subdomain, createdAt }: ServiceCardProps) {
  return (
    <Link
      href={`/services/${id}`}
      className="group block rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-neutral-700 hover:bg-neutral-900/80"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">
            {name}
          </h3>
          <p className="mt-1 text-sm text-neutral-400">{subdomain}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-4 text-xs text-neutral-500">
        Created {new Date(createdAt).toLocaleDateString()}
      </div>
    </Link>
  );
}
