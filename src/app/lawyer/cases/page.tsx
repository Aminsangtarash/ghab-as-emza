import type { Metadata } from "next";

import { LawyerCases } from "@/components/lawyer/lawyer-cases";

export const metadata: Metadata = {
  title: "پرونده‌های وکیل",
};

export default function LawyerCasesPage() {
  return <LawyerCases />;
}
