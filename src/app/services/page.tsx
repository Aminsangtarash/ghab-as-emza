import type { Metadata } from "next";

import { ConsultationCta } from "@/components/services/consultation-cta";
import { ServicesGrid } from "@/components/services/services-grid";
import { ServicesHero } from "@/components/services/services-hero";

export const metadata: Metadata = {
  title: "خدمات حقوقی",
  description:
    "تنظیم قرارداد، بررسی قراردادها، مشاوره آنلاین، داوری، پیگیری پرونده و شبکه وکلا.",
};

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <ServicesGrid />
      <ConsultationCta />
    </>
  );
}
