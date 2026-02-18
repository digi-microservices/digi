"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "~/lib/graphql";
import { EnvEditor, type EnvVar } from "~/components/env-editor";

type SourceType = "github" | "docker";

interface FormData {
  name: string;
  sourceType: SourceType;
  repoUrl: string;
  branch: string;
  dockerImage: string;
  components: {
    app: boolean;
    postgres: boolean;
    redis: boolean;
    customDocker: boolean;
  };
  envVars: EnvVar[];
}

const initialForm: FormData = {
  name: "",
  sourceType: "github",
  repoUrl: "",
  branch: "main",
  dockerImage: "",
  components: {
    app: true,
    postgres: false,
    redis: false,
    customDocker: false,
  },
  envVars: [],
};

export default function NewServicePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function next() {
    setStep((s) => Math.min(s + 1, 5));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleCreate() {
    setSubmitting(true);
    setError(null);

    try {
      const selectedComponents = Object.entries(form.components)
        .filter(([, v]) => v)
        .map(([k]) => k);

      await gql(`
        mutation CreateService($input: CreateServiceInput!) {
          createService(input: $input) {
            id
          }
        }
      `, {
        input: {
          name: form.name,
          sourceType: form.sourceType,
          repoUrl: form.sourceType === "github" ? form.repoUrl : undefined,
          branch: form.sourceType === "github" ? form.branch : undefined,
          dockerImage: form.sourceType === "docker" ? form.dockerImage : undefined,
          components: selectedComponents,
          envVars: form.envVars.filter((v) => v.key.trim() !== ""),
        },
      });

      router.push("/services");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Create a new service</h1>
      <p className="mb-8 text-sm text-neutral-400">
        Step {step} of 5
      </p>

      {/* Step indicators */}
      <div className="mb-8 flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? "bg-blue-500" : "bg-neutral-800"}`}
          />
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        {/* Step 1: Name & Source Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Service details</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Service name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="my-service"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Source type
              </label>
              <div className="flex gap-3">
                {(["github", "docker"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, sourceType: type })}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                      form.sourceType === type
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    {type === "github" ? "GitHub Repository" : "Docker Image"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Source config */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">
              {form.sourceType === "github" ? "Repository" : "Docker image"}
            </h2>
            {form.sourceType === "github" ? (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                    Repository URL
                  </label>
                  <input
                    type="text"
                    value={form.repoUrl}
                    onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
                    placeholder="https://github.com/user/repo"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    placeholder="main"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Image name
                </label>
                <input
                  type="text"
                  value={form.dockerImage}
                  onChange={(e) => setForm({ ...form, dockerImage: e.target.value })}
                  placeholder="nginx:latest"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Components */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Components</h2>
            <p className="text-sm text-neutral-400">
              Select which components to include with your service.
            </p>
            {(
              [
                { key: "app", label: "Application", desc: "Your main application container" },
                { key: "postgres", label: "PostgreSQL", desc: "Managed PostgreSQL database" },
                { key: "redis", label: "Redis", desc: "In-memory cache and message broker" },
                { key: "customDocker", label: "Custom Docker", desc: "Additional Docker container" },
              ] as const
            ).map(({ key, label, desc }) => (
              <label
                key={key}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                  form.components[key]
                    ? "border-blue-500/50 bg-blue-500/5"
                    : "border-neutral-700 bg-neutral-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.components[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      components: { ...form.components, [key]: e.target.checked },
                    })
                  }
                  className="mt-0.5 h-4 w-4 rounded border-neutral-600 bg-neutral-700 accent-blue-500"
                />
                <div>
                  <span className="block text-sm font-medium text-white">{label}</span>
                  <span className="block text-xs text-neutral-400">{desc}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Step 4: Env vars */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Environment variables</h2>
            <p className="text-sm text-neutral-400">
              Add environment variables for your service. These will be injected at runtime.
            </p>
            <EnvEditor
              initial={form.envVars}
              onChange={(vars) => setForm({ ...form, envVars: vars })}
            />
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Review</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Name</span>
                <span className="text-white">{form.name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Source</span>
                <span className="text-white">
                  {form.sourceType === "github" ? form.repoUrl : form.dockerImage}
                </span>
              </div>
              {form.sourceType === "github" && (
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">Branch</span>
                  <span className="text-white">{form.branch}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Components</span>
                <span className="text-white">
                  {Object.entries(form.components)
                    .filter(([, v]) => v)
                    .map(([k]) => k)
                    .join(", ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Env vars</span>
                <span className="text-white">
                  {form.envVars.filter((v) => v.key.trim()).length} variable(s)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        {step > 1 ? (
          <button
            onClick={back}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button
            onClick={next}
            disabled={step === 1 && !form.name.trim()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Service"}
          </button>
        )}
      </div>
    </div>
  );
}
