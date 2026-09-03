import type { Metadata } from "next";

import { ConsultationWizard } from "@/components/consult/consultation-wizard";
import { getServerUser } from "@/lib/auth";
import { getLawyer, getService } from "@/lib/data";

export const metadata: Metadata = {
  title: "ثبت درخواست",
};

export default async function AccountConsultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getServerUser();
  const params = await searchParams;
  const lawyerSlug = typeof params.lawyer === "string" ? params.lawyer : undefined;
  const serviceSlug = typeof params.service === "string" ? params.service : undefined;
  const lawyer = lawyerSlug ? getLawyer(lawyerSlug) : undefined;
  const service = serviceSlug ? getService(serviceSlug) : undefined;

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gold-deep">مشاوره</p>
      <span className="mb-4 mt-3 block h-1 w-12 rounded-full bg-gold" />
      <h1 className="font-heading text-2xl font-bold text-navy">ثبت درخواست</h1>
      <p className="mt-2 mb-6 max-w-2xl text-sm leading-7 text-navy/65">
        همان مراحل سایت؛ پس از پرداخت آزمایشی، درخواست در فهرست پنل شما ثبت می‌شود.
      </p>
      <ConsultationWizard
        initialLawyer={lawyer}
        initialService={service && service.slug !== "lawyers" ? service.slug : undefined}
        user={user}
        embedded
      />
    </div>
  );
}
