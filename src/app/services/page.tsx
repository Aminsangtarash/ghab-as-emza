import type { Metadata } from "next";

import { ConsultationCta } from "@/components/services/consultation-cta";
import { ServicesGrid } from "@/components/services/services-grid";
import { ServicesHero } from "@/components/services/services-hero";

export const metadata: Metadata = {
  title: "خدمات حقوقی",
  description:
    "فهرست کامل موضوعات حقوقی؛ انتخاب موضوع و ثبت سریع درخواست برای بررسی مدیر.",
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
