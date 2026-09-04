import type { Metadata } from "next";

import { AdminLawyerDetailPanel } from "@/components/admin/admin-lawyer-detail";

export const metadata: Metadata = {
  title: "جزئیات وکیل",
};

export default function AdminLawyerDetailPage() {
  return <AdminLawyerDetailPanel />;
}
