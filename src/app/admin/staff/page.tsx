import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminStaffPanel } from "@/components/admin/admin-staff-panel";
import { canStaff } from "@/lib/admin-permissions";
import { getServerUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "کارکنان",
};

export default async function AdminStaffPage() {
  const user = await getServerUser();
  if (!canStaff(user?.role, "manageStaff")) {
    redirect("/admin");
  }
  return <AdminStaffPanel />;
}
