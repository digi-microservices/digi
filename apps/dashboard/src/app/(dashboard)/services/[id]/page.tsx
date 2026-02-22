"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { gql } from "~/lib/graphql";
import { StatusBadge } from "~/components/status-badge";

interface Container {
  id: string;
  type: string;
  name: string;
  status: string;
  subdomain: string;
}

interface Service {
  id: string;
  name: string;
  status: string;
  sourceType: string;
  gitUrl: string | null;
  branch: string;
  dockerImage: string | null;
  publicUrl: string;
  dashboardUrl: string;
  containers: Container[];
}

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchService() {
    const data = await gql<{ service: Service }>(`
      query Service($id: String!) {
        service(id: $id) {
          id name status sourceType gitUrl branch dockerImage
          publicUrl dashboardUrl
          containers { id type name status subdomain }
        }
      }
    `, { id: params.id });
    setService(data.service);
  }

  useEffect(() => {
    fetchService()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleDeploy() {
    if (!service) return;
    setActionLoading("deploy");
    try {
      await gql(`
        mutation Deploy($serviceId: String!) {
          deployService(serviceId: $serviceId) { id status }
        }
      `, { serviceId: service.id });
      await fetchService();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleContainerAction(containerId: string, action: "stop" | "restart") {
    if (!service) return;
    setActionLoading(`${action}-${containerId}`);
    try {
      const mutation = action === "stop" ? "stopContainer" : "restartContainer";
      await gql(`
        mutation ContainerAction($serviceId: String!, $containerId: String!) {
          ${mutation}(serviceId: $serviceId, containerId: $containerId) { id status }
        }
      `, { serviceId: service.id, containerId });
      await fetchService();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  function copyUrl() {
    if (!service) return;
    navigator.clipboard.writeText(service.publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!service) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{service.name}</h1>
            <StatusBadge status={service.status} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-neutral-400">{service.publicUrl}</span>
            <button
              onClick={copyUrl}
              className="rounded px-1.5 py-0.5 text-xs text-blue-400 transition hover:bg-neutral-800"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          {service.sourceType === "github" && service.gitUrl && (
            <p className="mt-1 text-xs text-neutral-500">
              {service.gitUrl} ({service.branch})
            </p>
          )}
          {service.sourceType === "docker" && service.dockerImage && (
            <p className="mt-1 text-xs text-neutral-500">
              Image: {service.dockerImage}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDeploy}
            disabled={actionLoading !== null}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {actionLoading === "deploy" ? "Deploying..." : "Deploy"}
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="mb-8 flex gap-3">
        <Link
          href={`/services/${service.id}/logs`}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
        >
          View Logs
        </Link>
        <Link
          href={`/services/${service.id}/settings`}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
        >
          Settings
        </Link>
        {service.dashboardUrl && (
          <a
            href={service.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
          >
            Dashboard URL
          </a>
        )}
      </div>

      {/* Containers */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Containers</h2>
        {service.containers.length === 0 ? (
          <p className="text-sm text-neutral-400">No containers provisioned yet.</p>
        ) : (
          <div className="space-y-3">
            {service.containers.map((container) => (
              <div
                key={container.id}
                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs font-mono text-neutral-300">
                    {container.type}
                  </span>
                  <div>
                    <span className="text-sm text-neutral-300">{container.name}</span>
                    {container.subdomain && (
                      <span className="ml-2 text-xs text-neutral-500">{container.subdomain}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={container.status} />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleContainerAction(container.id, "restart")}
                      disabled={actionLoading !== null}
                      className="rounded-md px-2 py-1 text-xs text-neutral-400 transition hover:bg-neutral-800 hover:text-white disabled:opacity-50"
                    >
                      {actionLoading === `restart-${container.id}` ? "..." : "Restart"}
                    </button>
                    <button
                      onClick={() => handleContainerAction(container.id, "stop")}
                      disabled={actionLoading !== null}
                      className="rounded-md px-2 py-1 text-xs text-neutral-400 transition hover:bg-neutral-800 hover:text-red-400 disabled:opacity-50"
                    >
                      {actionLoading === `stop-${container.id}` ? "..." : "Stop"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
