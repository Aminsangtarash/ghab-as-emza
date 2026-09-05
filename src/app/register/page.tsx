import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { PageHero } from "@/components/page-hero";
import { getServerUser } from "@/lib/auth";
import { panelHome } from "@/lib/account";
import { safeInternalPath } from "@/lib/paths";

export const metadata: Metadata = {
  title: "ثبت نام",
};

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  const nextHref = safeInternalPath(typeof params.next === "string" ? params.next : undefined);
  const user = await getServerUser();
  if (user) {
    redirect(nextHref || panelHome(user.role));
  }

  return (
    <>
      <PageHero
        title="ثبت نام"
        description="با شماره موبایل حساب بسازید؛ کد تأیید پیامکی برای شما ارسال می‌شود."
      />
      <section className="mx-auto w-full max-w-md px-4 pb-12 pt-10 sm:px-6 sm:pt-12">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/10">
          <AuthForm mode="register" nextHref={nextHref} />
        </div>
      </section>
    </>
  );
}
