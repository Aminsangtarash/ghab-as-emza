import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "ثبت نام",
};

export default function RegisterPage() {
  return (
    <>
      <PageHero
        title="ثبت نام"
        description="ثبت‌نام کامل در مرحله بعد به MySQL متصل می‌شود. برای شروع از مشاوره آنلاین استفاده کنید."
      />
      <section className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/10">
          <AuthForm mode="register" />
        </div>
      </section>
    </>
  );
}
