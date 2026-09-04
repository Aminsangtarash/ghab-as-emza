import type { Metadata } from "next";

import { AdminPricingPanel } from "@/components/admin/admin-pricing-panel";

export const metadata: Metadata = {
  title: "تعرفه و تخفیف",
};

export default function AdminPricingPage() {
  return <AdminPricingPanel />;
}
