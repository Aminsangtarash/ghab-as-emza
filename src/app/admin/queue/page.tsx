import type { Metadata } from "next";

import { AdminQueuePanel } from "@/components/admin/admin-queue-panel";

export const metadata: Metadata = {
  title: "صف عملیات",
};

export default function AdminQueuePage() {
  return <AdminQueuePanel />;
}
