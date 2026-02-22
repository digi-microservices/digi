"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { gql } from "~/lib/graphql";
import { LogViewer } from "~/components/log-viewer";

interface Container {
  id: string;
  type: string;
}

export default function ServiceLogsPage() {
  const params = useParams<{ id: string }>();
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gql<{ service: { containers: Container[] } }>(`
      query ServiceContainers($id: String!) {
        service(id: $id) {
          containers {
            id
            type
          }
        }
      }
    `, { id: params.id })
      .then((data) => {
        setContainers(data.service.containers);
        if (data.service.containers.length > 0) {
          setSelectedContainer(data.service.containers[0]!.id);
        }
      })
      .catch(() => {
        // handle silently
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/services/${params.id}`}
          className="text-sm text-neutral-400 hover:text-white transition"
        >
          &larr; Back to service
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-white">Logs</h1>

      {containers.length > 1 && (
        <div className="mb-4 flex gap-2">
          {containers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedContainer(c.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                selectedContainer === c.id
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                  : "text-neutral-400 border border-neutral-700 hover:bg-neutral-800"
              }`}
            >
              {c.type}
            </button>
          ))}
        </div>
      )}

      {selectedContainer ? (
        <LogViewer containerId={selectedContainer} />
      ) : (
        <p className="text-sm text-neutral-400">No containers available.</p>
      )}
    </div>
  );
}
