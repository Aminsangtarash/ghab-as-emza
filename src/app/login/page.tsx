import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "ورود",
};

export default function LoginPage() {
  return (
    <>
      <PageHero
        title="ورود"
        description="ورود کامل پس از اتصال پایگاه داده فعال می‌شود. همین حالا می‌توانید مشاوره بگیرید."
      />
      <section className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/10">
          <AuthForm mode="login" />
        </div>
      </section>
    </>
  );
}
