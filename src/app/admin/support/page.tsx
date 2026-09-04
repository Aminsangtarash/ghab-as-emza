import type { Metadata } from "next";

import { AdminSupportDesk } from "@/components/admin/admin-support-desk";

export const metadata: Metadata = {
  title: "پشتیبانی کاربران",
};

export default function AdminSupportPage() {
  return <AdminSupportDesk />;
}
