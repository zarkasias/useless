import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/admin" className="text-xl font-black">
            Useless Achievements Admin
          </Link>

          <AdminNav />
        </div>
      </header>

      {children}
    </div>
  );
}
