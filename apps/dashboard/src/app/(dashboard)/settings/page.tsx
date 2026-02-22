"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gql } from "~/lib/graphql";
import { authClient } from "~/lib/auth-client";
import { toast } from "sonner";
import { Input } from "@digi/ui";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface ApiToken {
  id: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
}

type Tab = "profile" | "security" | "tokens" | "appearance";

const tabs: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "tokens", label: "API Tokens" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gql<{ me: User }>(`query { me { id name email createdAt } }`)
      .then((data) => setUser(data.me))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Account Settings</h1>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-blue-500/10 text-blue-400"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && (
            <ProfileTab user={user} onUpdate={setUser} />
          )}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "tokens" && <TokensTab />}
          {activeTab === "appearance" && <AppearanceTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Profile Tab ──────────────────────────────────────────────── */

function ProfileTab({
  user,
  onUpdate,
}: {
  user: User | null;
  onUpdate: (u: User) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await authClient.updateUser({ name: name.trim() });
      if (user) onUpdate({ ...user, name: name.trim() });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-lg font-bold text-blue-400 ring-1 ring-blue-500/20">
          {user?.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-medium text-white">{user?.name}</p>
          <p className="text-sm text-neutral-500">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">
            Name
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">
            Email
          </label>
          <p className="rounded-lg border border-white/[0.08] bg-neutral-800/50 px-4 py-2.5 text-neutral-400">
            {user?.email}
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">
            Member since
          </label>
          <p className="text-sm text-neutral-400">
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || name.trim() === user?.name}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </section>
  );
}

/* ─── Security Tab ─────────────────────────────────────────────── */

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password. Check your current password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleChangeEmail() {
    if (!newEmail.trim()) return;
    setChangingEmail(true);
    try {
      await authClient.changeEmail({ newEmail: newEmail.trim() });
      toast.success("Verification email sent to your new address");
      setNewEmail("");
    } catch {
      toast.error("Failed to change email");
    } finally {
      setChangingEmail(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Change Password
        </h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              Current password
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              New password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              Confirm new password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={
              changingPassword ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Change Email</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              New email address
            </label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleChangeEmail}
            disabled={changingEmail || !newEmail.trim()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changingEmail ? "Sending..." : "Change Email"}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ─── Tokens Tab ───────────────────────────────────────────────── */

function TokensTab() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchTokens() {
    const data = await gql<{ apiTokens: ApiToken[] }>(`
      query { apiTokens { id name lastUsedAt createdAt } }
    `);
    setTokens(data.apiTokens);
  }

  useEffect(() => {
    fetchTokens().finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const data = await gql<{ generateApiToken: { token: string } }>(
        `
        mutation($name: String!) { generateApiToken(name: $name) { token } }
      `,
        { name: newName },
      );
      setNewToken(data.generateApiToken.token);
      setNewName("");
      await fetchTokens();
      toast.success("Token created");
    } catch {
      toast.error("Failed to create token");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API token?")) return;
    try {
      await gql(`mutation($id: String!) { revokeApiToken(id: $id) }`, { id });
      await fetchTokens();
      toast.success("Token revoked");
    } catch {
      toast.error("Failed to revoke token");
    }
  }

  function handleCopy() {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New token display */}
      {newToken && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <p className="mb-2 text-sm font-medium text-green-400">
            Token created! Copy it now — it won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-black/50 px-3 py-2 text-xs text-white">
              {newToken}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-400 hover:text-white"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Create token */}
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Create Token</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Token name (e.g. CI/CD)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-blue-500"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </section>

      {/* Token list */}
      <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Active Tokens</h2>
        {tokens.length === 0 ? (
          <p className="text-sm text-neutral-500">No API tokens yet.</p>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.08] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{token.name}</p>
                  <p className="text-xs text-neutral-500">
                    Created {new Date(token.createdAt).toLocaleDateString()}
                    {token.lastUsedAt &&
                      ` · Last used ${new Date(token.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(token.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ─── Appearance Tab ───────────────────────────────────────────── */

function AppearanceTab() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("digi-theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    }
  }, []);

  function handleThemeChange(newTheme: "dark" | "light") {
    setTheme(newTheme);
    localStorage.setItem("digi-theme", newTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(newTheme);
    toast.success(`Switched to ${newTheme} mode`);
  }

  return (
    <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Theme</h2>
      <p className="mb-4 text-sm text-neutral-400">
        Choose your preferred appearance. Light mode styling is a work in
        progress.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => handleThemeChange("dark")}
          className={`flex-1 rounded-lg border p-4 text-center transition ${
            theme === "dark"
              ? "border-blue-500 bg-blue-500/10 text-blue-400"
              : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600"
          }`}
        >
          <MoonIcon className="mx-auto mb-2 h-6 w-6" />
          <span className="text-sm font-medium">Dark</span>
        </button>
        <button
          onClick={() => handleThemeChange("light")}
          className={`flex-1 rounded-lg border p-4 text-center transition ${
            theme === "light"
              ? "border-blue-500 bg-blue-500/10 text-blue-400"
              : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600"
          }`}
        >
          <SunIcon className="mx-auto mb-2 h-6 w-6" />
          <span className="text-sm font-medium">Light</span>
        </button>
      </div>
    </section>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    </svg>
  );
}
