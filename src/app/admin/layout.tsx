import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { isStaffRole } from "@/lib/account";
import { getServerUser } from "@/lib/auth";
import { ensureStaffAccounts } from "@/lib/staff-accounts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پنل مدیریت",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureStaffAccounts();
  const { refreshAdminCaches } = await import("@/lib/admin-ops");
  await refreshAdminCaches();
  const user = await getServerUser();
  if (!user) {
    redirect("/login?next=/admin");
  }
  if (!isStaffRole(user.role)) {
    redirect(user.role === "lawyer" ? "/lawyer" : "/account");
  }
  if (user.active === false) {
    redirect("/login?next=/admin");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
