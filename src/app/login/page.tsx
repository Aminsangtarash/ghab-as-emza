import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { PageHero } from "@/components/page-hero";
import { getServerUser } from "@/lib/auth";
import { panelHome } from "@/lib/account";
import { safeInternalPath } from "@/lib/paths";

export const metadata: Metadata = {
  title: "ورود",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const nextHref = safeInternalPath(typeof params.next === "string" ? params.next : undefined);
  const user = await getServerUser();
  if (user) {
    redirect(nextHref || panelHome(user.role));
  }

  return (
    <>
      <PageHero
        title="ورود"
        description="با شماره موبایل و کد تأیید پیامکی وارد شوید. ثبت درخواست مشاوره فقط با حساب کاربری ممکن است."
      />
      <section className="mx-auto w-full max-w-md px-4 pb-12 pt-10 sm:px-6 sm:pt-12">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/10">
          <AuthForm mode="login" nextHref={nextHref} />
        </div>
      </section>
    </>
  );
}
