import type { Metadata } from "next";

import { LawyersExplorer } from "@/components/lawyers/lawyers-explorer";
import { LawyersHero } from "@/components/lawyers/lawyers-hero";
import { ConsultationCta } from "@/components/services/consultation-cta";

export const metadata: Metadata = {
  title: "وکلا و متخصصان",
  description: "شبکه وکلا و کارشناسان حقوقی با حوزه تخصصی مشخص.",
};

export default function LawyersPage() {
  return (
    <>
      <LawyersHero />
      <LawyersExplorer />
      <ConsultationCta />
    </>
  );
}
