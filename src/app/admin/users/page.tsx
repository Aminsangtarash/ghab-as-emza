import type { Metadata } from "next";

import { AdminUsersPanel } from "@/components/admin/admin-users-panel";

export const metadata: Metadata = {
  title: "کاربران",
};

export default function AdminUsersPage() {
  return <AdminUsersPanel />;
}
