"use client";

import { useEffect, useState } from "react";
import { graphqlClient } from "~/lib/graphql";
import { DataTable } from "~/components/data-table";
import { Input } from "@digi/ui/src/components/input";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
  serviceCount: number;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchUsers() {
    const res = await graphqlClient<{ users: User[] }>(`
      query { users { id name email role suspended services {  id } serviceCount createdAt } }
    `);
    if (res && res.users) setUsers(res.users);
  }

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  async function handleSuspend(id: string, suspended: boolean) {
    const mutation = suspended ? "unsuspendUser" : "suspendUser";
    await graphqlClient(`mutation($id: ID!) { ${mutation}(id: $id) { id } }`, {
      id,
    });
    await fetchUsers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Permanently delete this user and all their data?")) return;
    await graphqlClient(`mutation($id: ID!) { deleteUser(id: $id) }`, { id });
    await fetchUsers();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Users</h1>
      <Input
        placeholder="Search Here..."
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />
      <DataTable
        columns={["ID", "Name", "Email", "Role", "Services", "Joined", "Status", ""]}
        rows={users
          .filter(
            (u) =>
              u.name.toLowerCase().includes(search.toLowerCase()) ||
              u.email.toLowerCase().includes(search.toLowerCase()) ||
              u.id.toLowerCase().includes(search.toLowerCase()),
          )
          .sort((a, b) => (a.role === "admin" ? -1 : 1))
          .map((u) => [
            u.id,
            u.name,
            u.email,
            <span
              key={u.id}
              className={
                u.role === "admin" ? "text-blue-400" : "text-neutral-400"
              }
            >
              {u.role}
            </span>,
            String(u.serviceCount),
            new Date(u.createdAt).toLocaleDateString(),
            u.suspended ? (
              <span key={`s-${u.id}`} className="text-red-400">
                Suspended
              </span>
            ) : (
              <span key={`s-${u.id}`} className="text-green-400">
                Active
              </span>
            ),
            <div key={`a-${u.id}`} className="flex gap-2">
              <button
                onClick={() => handleSuspend(u.id, u.suspended)}
                className="text-xs text-yellow-400 hover:text-yellow-300"
              >
                {u.suspended ? "Unsuspend" : "Suspend"}
              </button>
              {u.role !== "admin" && (
                <button
                  onClick={() => handleDelete(u.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              )}
            </div>,
          ])}
      />
    </div>
  );
}
