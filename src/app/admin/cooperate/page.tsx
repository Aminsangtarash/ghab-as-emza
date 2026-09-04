import type { Metadata } from "next";

import { AdminCooperatePanel } from "@/components/admin/admin-cooperate-panel";

export const metadata: Metadata = {
  title: "همکاری وکلا",
};

export default function AdminCooperatePage() {
  return <AdminCooperatePanel />;
}
