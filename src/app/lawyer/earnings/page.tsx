import type { Metadata } from "next";

import { LawyerEarnings } from "@/components/lawyer/lawyer-earnings";

export const metadata: Metadata = {
  title: "درآمد",
};

export default function LawyerEarningsPage() {
  return <LawyerEarnings />;
}
