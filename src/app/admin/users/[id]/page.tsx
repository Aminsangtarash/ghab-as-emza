import type { Metadata } from "next";

import { AdminUserDetailPanel } from "@/components/admin/admin-user-detail";

export const metadata: Metadata = {
  title: "جزئیات کاربر",
};

export default function AdminUserDetailPage() {
  return <AdminUserDetailPanel />;
}
