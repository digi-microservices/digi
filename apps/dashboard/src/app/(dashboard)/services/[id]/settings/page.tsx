"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { gql } from "~/lib/graphql";
import { EnvEditor, type EnvVar } from "~/components/env-editor";

interface ServiceSettings {
  id: string;
  name: string;
  domain: string;
  envVars: EnvVar[];
}

export default function ServiceSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [settings, setSettings] = useState<ServiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    gql<{ serviceSettings: ServiceSettings }>(`
      query ServiceSettings($id: ID!) {
        serviceSettings(id: $id) {
          id
          name
          domain
          envVars {
            key
            value
          }
        }
      }
    `, { id: params.id })
      .then((data) => {
        setSettings(data.serviceSettings);
        setEnvVars(data.serviceSettings.envVars);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSaveEnvVars() {
    setSaving(true);
    setError(null);

    try {
      await gql(`
        mutation UpdateEnvVars($id: ID!, $envVars: [EnvVarInput!]!) {
          updateEnvVars(serviceId: $id, envVars: $envVars) {
            id
          }
        }
      `, {
        id: params.id,
        envVars: envVars.filter((v) => v.key.trim() !== ""),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await gql(`
        mutation DeleteService($id: ID!) {
          deleteService(id: $id)
        }
      `, { id: params.id });
      router.push("/services");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/services/${params.id}`}
          className="text-sm text-neutral-400 hover:text-white transition"
        >
          &larr; Back to service
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold text-white">Settings</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Domain */}
      {settings && (
        <section className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Domain</h2>
          <p className="text-sm text-neutral-300 font-mono">{settings.domain}</p>
        </section>
      )}

      {/* Environment Variables */}
      <section className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Environment Variables</h2>
          <button
            onClick={handleSaveEnvVars}
            disabled={saving}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
        </div>
        <EnvEditor initial={envVars} onChange={setEnvVars} />
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="mb-2 text-lg font-semibold text-red-400">Danger Zone</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Permanently delete this service and all its data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
        >
          Delete Service
        </button>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="mb-2 text-lg font-semibold text-white">Delete service?</h3>
            <p className="mb-6 text-sm text-neutral-400">
              This will permanently delete <strong className="text-white">{settings?.name}</strong>{" "}
              and all associated containers, databases, and data.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
