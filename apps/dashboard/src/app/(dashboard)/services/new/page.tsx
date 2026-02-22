"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { gql } from "~/lib/graphql";
import { EnvEditor, type EnvVar } from "~/components/env-editor";

type SourceType = "github" | "docker";

interface PlatformDomain {
  id: string;
  domain: string;
  isDefault: boolean;
}

interface UserSub {
  plan: { name: string } | null;
}

interface FormData {
  name: string;
  sourceType: SourceType;
  repoUrl: string;
  branch: string;
  dockerImage: string;
  dockerPort: string;
  components: Record<string, boolean>;
  customDockerImage: string;
  envVars: EnvVar[];
  platformDomainId: string;
  customDomain: string;
  resourcePlan: "free" | "pro" | "custom";
  customCpu: string;
  customMemory: string;
}

const initialForm: FormData = {
  name: "",
  sourceType: "github",
  repoUrl: "",
  branch: "main",
  dockerImage: "",
  dockerPort: "3000",
  components: { app: true },
  customDockerImage: "",
  envVars: [],
  platformDomainId: "",
  customDomain: "",
  resourcePlan: "free",
  customCpu: "1",
  customMemory: "512",
};

const TOTAL_STEPS = 6;

/* ─── Component definitions with icons + colors ──────────────── */

interface ComponentDef {
  key: string;
  label: string;
  desc: string;
  color: string; // ring/bg accent
  bgColor: string;
  textColor: string;
  category: "runtime" | "database" | "cache";
  dockerImage?: string;
  icon: (props: { className?: string }) => React.ReactNode;
}

const componentDefs: ComponentDef[] = [
  {
    key: "app",
    label: "Application",
    desc: "Your main application container",
    color: "border-blue-500/50 bg-blue-500/5",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    category: "runtime",
    icon: AppIcon,
  },
  {
    key: "postgres",
    label: "PostgreSQL",
    desc: "Advanced open-source relational database",
    color: "border-sky-500/50 bg-sky-500/5",
    bgColor: "bg-sky-500/10",
    textColor: "text-sky-400",
    category: "database",
    dockerImage: "postgres:16",
    icon: DatabaseIcon,
  },
  {
    key: "mysql",
    label: "MySQL",
    desc: "Popular relational database",
    color: "border-orange-500/50 bg-orange-500/5",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-400",
    category: "database",
    dockerImage: "mysql:8",
    icon: DatabaseIcon,
  },
  {
    key: "mongodb",
    label: "MongoDB",
    desc: "NoSQL document database",
    color: "border-green-500/50 bg-green-500/5",
    bgColor: "bg-green-500/10",
    textColor: "text-green-400",
    category: "database",
    dockerImage: "mongo:7",
    icon: DatabaseIcon,
  },
  {
    key: "redis",
    label: "Redis",
    desc: "In-memory data store and cache",
    color: "border-red-500/50 bg-red-500/5",
    bgColor: "bg-red-500/10",
    textColor: "text-red-400",
    category: "cache",
    dockerImage: "redis:7",
    icon: CacheIcon,
  },
  {
    key: "valkey",
    label: "Valkey",
    desc: "Open-source Redis-compatible key-value store",
    color: "border-purple-500/50 bg-purple-500/5",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-400",
    category: "cache",
    dockerImage: "valkey/valkey:8",
    icon: CacheIcon,
  },
  {
    key: "customDocker",
    label: "Custom Docker",
    desc: "Bring your own Docker image",
    color: "border-neutral-500/50 bg-neutral-500/5",
    bgColor: "bg-neutral-500/10",
    textColor: "text-neutral-400",
    category: "runtime",
    icon: ContainerIcon,
  },
];

const resourcePlans = [
  {
    id: "free" as const,
    label: "Free",
    cpu: "0.5 vCPU",
    memory: "256 MB",
    desc: "For hobby projects and testing",
    tag: "Included",
  },
  {
    id: "pro" as const,
    label: "Pro",
    cpu: "2 vCPU",
    memory: "1 GB",
    desc: "Production-ready performance",
    tag: "Paid plan",
  },
  {
    id: "custom" as const,
    label: "Custom",
    cpu: "Custom",
    memory: "Custom",
    desc: "Set your own resource limits",
    tag: "Usage-based",
  },
];

export default function NewServicePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domains, setDomains] = useState<PlatformDomain[]>([]);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    gql<{ domains: PlatformDomain[] }>(
      `query { domains { id domain isDefault } }`,
    )
      .then((data) => {
        setDomains(data.domains);
        const def = data.domains.find((d) => d.isDefault);
        if (def) setForm((f) => ({ ...f, platformDomainId: def.id }));
      })
      .catch(() => {});

    gql<{ me: { subscription: UserSub | null } }>(
      `query { me { subscription { plan { name } } } }`,
    )
      .then((data) => setUserPlan(data.me.subscription?.plan?.name ?? null))
      .catch(() => {});
  }, []);

  const isPro = userPlan && userPlan.toLowerCase() !== "free";

  function next() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }
  function back() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }

  function toggleComponent(key: string) {
    setForm((f) => ({
      ...f,
      components: { ...f.components, [key]: !f.components[key] },
    }));
  }

  function handleEnvFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed: EnvVar[] = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const eqIdx = line.indexOf("=");
          if (eqIdx === -1) return { key: line, value: "" };
          return { key: line.slice(0, eqIdx), value: line.slice(eqIdx + 1) };
        });
      setForm((f) => ({ ...f, envVars: [...f.envVars, ...parsed] }));
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-uploaded
    e.target.value = "";
  }

  async function handleCreate() {
    setSubmitting(true);
    setError(null);

    try {
      const containers = Object.entries(form.components)
        .filter(([, v]) => v)
        .map(([k]) => {
          const def = componentDefs.find((d) => d.key === k);
          const type = k === "customDocker" ? "docker" : k;
          const dockerImage =
            k === "customDocker"
              ? form.customDockerImage || undefined
              : def?.dockerImage;

          const resourceLimits =
            k === "app"
              ? form.resourcePlan === "free"
                ? { cpuCores: 0.5, memoryMb: 256 }
                : form.resourcePlan === "pro"
                  ? { cpuCores: 2, memoryMb: 1024 }
                  : {
                      cpuCores: Number(form.customCpu),
                      memoryMb: Number(form.customMemory),
                    }
              : undefined;

          return {
            type,
            name: `${form.name}-${k}`,
            internalPort: k === "app" ? Number(form.dockerPort) : undefined,
            ...(dockerImage ? { dockerImage } : {}),
            ...(resourceLimits ? { resourceLimits } : {}),
          };
        });

      const envVarsObj: Record<string, string> = {};
      for (const v of form.envVars) {
        if (v.key.trim()) envVarsObj[v.key] = v.value;
      }

      await gql(
        `
        mutation CreateService($input: CreateServiceInput!) {
          createService(input: $input) { id }
        }
      `,
        {
          input: {
            name: form.name,
            sourceType: form.sourceType,
            gitUrl: form.sourceType === "github" ? form.repoUrl : undefined,
            branch: form.sourceType === "github" ? form.branch : undefined,
            dockerImage:
              form.sourceType === "docker" ? form.dockerImage : undefined,
            platformDomainId: form.platformDomainId || undefined,
            customDomain:
              isPro && form.customDomain ? form.customDomain : undefined,
            containers,
            envVars:
              Object.keys(envVarsObj).length > 0 ? envVarsObj : undefined,
          },
        },
      );

      router.push("/services");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedComponents = componentDefs.filter(
    (d) => form.components[d.key],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-white">
        Create a new service
      </h1>
      <p className="mb-8 text-sm text-neutral-400">
        Step {step} of {TOTAL_STEPS}
      </p>

      {/* Step indicators */}
      <div className="mb-8 flex gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-blue-500" : "bg-white/[0.06]"}`}
          />
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── Step 1: Name & Source ── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">
                  Service details
                </h2>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                    Service name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="my-service"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-neutral-500 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
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
                            : "border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:border-white/[0.15]"
                        }`}
                      >
                        {type === "github"
                          ? "GitHub Repository"
                          : "Docker Image"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Source config ── */}
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
                        onChange={(e) =>
                          setForm({ ...form, repoUrl: e.target.value })
                        }
                        placeholder="https://github.com/user/repo"
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-neutral-500 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                        Branch
                      </label>
                      <input
                        type="text"
                        value={form.branch}
                        onChange={(e) =>
                          setForm({ ...form, branch: e.target.value })
                        }
                        placeholder="main"
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-neutral-500 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                        Image name
                      </label>
                      <input
                        type="text"
                        value={form.dockerImage}
                        onChange={(e) =>
                          setForm({ ...form, dockerImage: e.target.value })
                        }
                        placeholder="nginx:latest"
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-neutral-500 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                        Internal Container Port
                      </label>
                      <input
                        type="number"
                        value={form.dockerPort}
                        onChange={(e) =>
                          setForm({ ...form, dockerPort: e.target.value })
                        }
                        placeholder="3000"
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-neutral-500 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Step 3: Components ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Components
                  </h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Select databases, caches, and containers for your service.
                  </p>
                </div>

                {/* Databases */}
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Databases
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {componentDefs
                      .filter((d) => d.category === "database")
                      .map((comp) => (
                        <button
                          key={comp.key}
                          type="button"
                          onClick={() => toggleComponent(comp.key)}
                          className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition ${
                            form.components[comp.key]
                              ? comp.color
                              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${form.components[comp.key] ? comp.bgColor : "bg-white/[0.04]"}`}
                          >
                            <comp.icon
                              className={`h-4 w-4 ${form.components[comp.key] ? comp.textColor : "text-neutral-500"}`}
                            />
                          </div>
                          <div className="min-w-0">
                            <span
                              className={`block text-sm font-medium ${form.components[comp.key] ? comp.textColor : "text-white"}`}
                            >
                              {comp.label}
                            </span>
                            <span className="block text-xs text-neutral-500">
                              {comp.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Caches */}
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Caches
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {componentDefs
                      .filter((d) => d.category === "cache")
                      .map((comp) => (
                        <button
                          key={comp.key}
                          type="button"
                          onClick={() => toggleComponent(comp.key)}
                          className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition ${
                            form.components[comp.key]
                              ? comp.color
                              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${form.components[comp.key] ? comp.bgColor : "bg-white/[0.04]"}`}
                          >
                            <comp.icon
                              className={`h-4 w-4 ${form.components[comp.key] ? comp.textColor : "text-neutral-500"}`}
                            />
                          </div>
                          <div className="min-w-0">
                            <span
                              className={`block text-sm font-medium ${form.components[comp.key] ? comp.textColor : "text-white"}`}
                            >
                              {comp.label}
                            </span>
                            <span className="block text-xs text-neutral-500">
                              {comp.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Custom Docker */}
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Custom
                  </p>
                  {componentDefs
                    .filter((d) => d.key === "customDocker")
                    .map((comp) => (
                      <button
                        key={comp.key}
                        type="button"
                        onClick={() => toggleComponent(comp.key)}
                        className={`flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition ${
                          form.components[comp.key]
                            ? comp.color
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${form.components[comp.key] ? comp.bgColor : "bg-white/[0.04]"}`}
                        >
                          <comp.icon
                            className={`h-4 w-4 ${form.components[comp.key] ? comp.textColor : "text-neutral-500"}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <span
                            className={`block text-sm font-medium ${form.components[comp.key] ? comp.textColor : "text-white"}`}
                          >
                            {comp.label}
                          </span>
                          <span className="block text-xs text-neutral-500">
                            {comp.desc}
                          </span>
                        </div>
                      </button>
                    ))}
                  {form.components.customDocker && (
                    <div className="ml-11 mt-3">
                      <input
                        type="text"
                        value={form.customDockerImage}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            customDockerImage: e.target.value,
                          })
                        }
                        placeholder="myregistry/myimage:latest"
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-neutral-500 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 4: Domain & Resources ── */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white">Domain</h2>
                  {domains.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                        Platform domain
                      </label>
                      <select
                        value={form.platformDomainId}
                        onChange={(e) =>
                          setForm({ ...form, platformDomainId: e.target.value })
                        }
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white outline-none focus:border-blue-500/50"
                      >
                        <option value="">Auto-select (lowest usage)</option>
                        {domains.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.domain}
                            {d.isDefault ? " (default)" : ""}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-neutral-500">
                        Available at {form.name || "your-service"}.
                        {domains.find((d) => d.id === form.platformDomainId)
                          ?.domain ??
                          domains.find((d) => d.isDefault)?.domain ??
                          "example.com"}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                      Custom domain
                      {!isPro && (
                        <span className="ml-2 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-400">
                          Pro plan
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={form.customDomain}
                      onChange={(e) =>
                        setForm({ ...form, customDomain: e.target.value })
                      }
                      placeholder="app.yourdomain.com"
                      disabled={!isPro}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-neutral-500 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                    />
                    {isPro ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        Point a CNAME record to your platform domain. SSL
                        provisioned automatically.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-amber-400/60">
                        Upgrade to a Pro plan to use custom domains.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/[0.06] pt-6">
                  <h2 className="text-lg font-semibold text-white">
                    Resources
                  </h2>
                  <div className="space-y-3">
                    {resourcePlans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, resourcePlan: plan.id })
                        }
                        className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition ${
                          form.resourcePlan === plan.id
                            ? "border-blue-500 bg-blue-500/5"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${form.resourcePlan === plan.id ? "text-blue-400" : "text-white"}`}
                            >
                              {plan.label}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-xs ${
                                plan.id === "free"
                                  ? "bg-green-500/10 text-green-400"
                                  : plan.id === "pro"
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "bg-neutral-500/10 text-neutral-400"
                              }`}
                            >
                              {plan.tag}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {plan.desc}
                          </p>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {plan.cpu} · {plan.memory}
                        </span>
                      </button>
                    ))}
                  </div>
                  {form.resourcePlan === "custom" && (
                    <div className="flex gap-4 pt-2">
                      <div className="flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                          CPU cores
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="8"
                          value={form.customCpu}
                          onChange={(e) =>
                            setForm({ ...form, customCpu: e.target.value })
                          }
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                          Memory (MB)
                        </label>
                        <input
                          type="number"
                          step="128"
                          min="128"
                          max="8192"
                          value={form.customMemory}
                          onChange={(e) =>
                            setForm({ ...form, customMemory: e.target.value })
                          }
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 5: Env vars ── */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Environment variables
                    </h2>
                    <p className="mt-1 text-sm text-neutral-400">
                      Injected at runtime. You can also upload a .env file.
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".env,.env.local,.env.production,.txt"
                      onChange={handleEnvFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-neutral-400 transition hover:border-white/[0.15] hover:text-white"
                    >
                      Upload .env
                    </button>
                  </div>
                </div>
                <EnvEditor
                  initial={form.envVars}
                  onChange={(vars) => setForm({ ...form, envVars: vars })}
                />
              </div>
            )}

            {/* ── Step 6: Review ── */}
            {step === 6 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Review</h2>
                <div className="space-y-3 text-sm">
                  <ReviewRow label="Name" value={form.name} />
                  <ReviewRow
                    label="Source"
                    value={
                      form.sourceType === "github"
                        ? form.repoUrl
                        : form.dockerImage
                    }
                  />
                  {form.sourceType === "github" && (
                    <ReviewRow label="Branch" value={form.branch} />
                  )}
                  <ReviewRow
                    label="Components"
                    value={selectedComponents.map((c) => c.label).join(", ")}
                  />
                  {isPro && form.customDomain && (
                    <ReviewRow
                      label="Custom domain"
                      value={form.customDomain}
                    />
                  )}
                  <ReviewRow
                    label="Resources"
                    value={
                      form.resourcePlan === "custom"
                        ? `${form.customCpu} vCPU · ${form.customMemory} MB`
                        : (resourcePlans.find((p) => p.id === form.resourcePlan)
                            ?.label ?? "Free")
                    }
                  />
                  <div className="flex justify-between pt-1">
                    <span className="text-neutral-400">Env vars</span>
                    <span className="text-white">
                      {form.envVars.filter((v) => v.key.trim()).length}{" "}
                      variable(s)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        {step > 1 ? (
          <button
            onClick={back}
            className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/[0.04]"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < TOTAL_STEPS ? (
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

/* ─── Tiny helper ─────────────────────────────────────────────── */

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/[0.06] pb-2">
      <span className="text-neutral-400">{label}</span>
      <span className="max-w-[60%] truncate text-right text-white">
        {value}
      </span>
    </div>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */

function AppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function CacheIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function ContainerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h7.5" />
      <path d="M6 8h12" />
      <path d="M6 12h4" />
      <circle cx="18" cy="18" r="3" />
      <path d="M18 15v3h3" />
    </svg>
  );
}
