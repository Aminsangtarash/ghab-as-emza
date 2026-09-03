import type { Metadata } from "next";

import { LawyerRatings } from "@/components/lawyer/lawyer-ratings";

export const metadata: Metadata = {
  title: "امتیازها",
};

export default function LawyerRatingsPage() {
  return <LawyerRatings />;
}
