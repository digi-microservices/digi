import AdminSidebar from "~/components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950">
      <AdminSidebar />
      <main className="pl-56">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
