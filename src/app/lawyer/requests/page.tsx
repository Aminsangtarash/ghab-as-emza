import type { Metadata } from "next";

import { LawyerQueue } from "@/components/lawyer/lawyer-queue";

export const metadata: Metadata = {
  title: "درخواست‌های جدید",
};

export default function LawyerRequestsPage() {
  return <LawyerQueue />;
}
