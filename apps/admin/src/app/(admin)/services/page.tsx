"use client";

import { useEffect, useState } from "react";
import { graphqlClient } from "~/lib/graphql";
import { DataTable } from "~/components/data-table";
import { Input } from "@digi/ui";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
  serviceCount: number;
  services: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    sourceType: string;
  }[];
  createdAt: string;
}

export default function ServicesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchUsers() {
    const res = await graphqlClient<{ users: User[] }>(`
      query { users { id name email role suspended services { id name status createdAt sourceType } serviceCount createdAt } }
    `);

    console.log("Fetched users:", res.users);
    if (res.users) setUsers(res.users);
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
      <h1 className="mb-6 text-2xl font-bold text-white">Services</h1>
      <Input
        placeholder="Search Here..."
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />
      <DataTable
        columns={[
          "Id",
          "Owner",
          "Owner ID",
          "Name",
          "Source Type",
          "Status",
          "Created At",
          "",
        ]}
        rows={users.flatMap((u) =>
          u.services
            .filter(
              (s) =>
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.id.toLowerCase().includes(search.toLowerCase()) ||
                s.id.toLowerCase().includes(search.toLowerCase()),
            )
            .map((s) => [
              s.id,
              u.name,
              u.id,
              s.name,
              s.sourceType,
              s.status,
              new Date(s.createdAt).toLocaleString(),
            ]),
        )}
      />
    </div>
  );
}
