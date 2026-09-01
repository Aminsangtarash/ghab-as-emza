import type { Metadata } from "next";

import { ConsultationForm } from "@/components/consult/consultation-form";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "مشاوره آنلاین",
  description: "درخواست مشاوره حقوقی آنلاین با کد پیگیری.",
};

export default function ConsultPage() {
  return (
    <>
      <PageHero
        title="مشاوره آنلاین"
        description="موضوع را بدون ارسال مدارک محرمانه شرح دهید. پس از ثبت، کد پیگیری دریافت می‌کنید."
      />
      <section className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/10 sm:p-8">
          <ConsultationForm />
        </div>
      </section>
    </>
  );
}
