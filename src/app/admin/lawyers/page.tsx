import type { Metadata } from "next";

import { AdminLawyersPanel } from "@/components/admin/admin-lawyers-panel";

export const metadata: Metadata = {
  title: "وکلا",
};

export default function AdminLawyersPage() {
  return <AdminLawyersPanel />;
}
