import type { Metadata } from "next";

import { ConsultAuthGate } from "@/components/consult/consult-auth-gate";
import { isUrgentConsultService } from "@/lib/consult";
import { getLawyer, getService } from "@/lib/data";

export async function generateMetadata({
  searchParams,
}: PageProps<"/consult">): Promise<Metadata> {
  const params = await searchParams;
  const lawyerSlug = typeof params.lawyer === "string" ? params.lawyer : undefined;
  const serviceSlug = typeof params.service === "string" ? params.service : undefined;
  const lawyer = lawyerSlug ? getLawyer(lawyerSlug) : undefined;
  if (lawyer) {
    return {
      title: `درخواست مشاوره با ${lawyer.name}`,
      description: "ثبت درخواست مشاوره متنی، تماس تلفنی یا تماس تصویری.",
    };
  }
  if (serviceSlug && isUrgentConsultService(serviceSlug)) {
    return {
      title: "مشاوره فوری",
      description: "درخواست فوری قبل از امضا؛ اتصال به اولین وکیل پذیرنده.",
    };
  }
  return {
    title: "ثبت درخواست مشاوره",
    description: "درخواست مشاوره حقوقی را مرحله‌به‌مرحله ثبت کنید و کد پیگیری بگیرید.",
  };
}

export default async function ConsultPage({ searchParams }: PageProps<"/consult">) {
  const params = await searchParams;
  const lawyerSlug = typeof params.lawyer === "string" ? params.lawyer : undefined;
  const serviceSlug = typeof params.service === "string" ? params.service : undefined;
  const lawyer = lawyerSlug ? getLawyer(lawyerSlug) : undefined;
  const service = serviceSlug ? getService(serviceSlug) : undefined;
  const initialService = service && service.slug !== "lawyers" ? service.slug : undefined;
  const urgent = initialService ? isUrgentConsultService(initialService) : false;

  return (
    <>
      <section className="relative overflow-hidden bg-navy-deep">
        <div className="relative mx-auto w-full max-w-5xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-20">
          <p className="text-sm font-medium text-gold">{urgent ? "قبل از امضا" : "ثبت درخواست"}</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">
            {urgent ? "مشاوره فوری حقوقی" : "مشاوره حقوقی، مرحله‌به‌مرحله"}
          </h1>
          <span className="mt-3 block h-1 w-14 rounded-full bg-gold" />
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            {urgent
              ? "موضوع را کوتاه بنویسید و پرداخت کنید؛ نحوه ارتباط و درخواست مدرک بر اساس صلاح‌دید وکیل است."
              : "مشاوره متنی و تماس تصویری داخل سایت انجام می‌شود؛ تماس تلفنی را دفتر هماهنگ می‌کند. اگر وکیل انتخاب نکنید، اپراتور متخصص مناسب را مشخص می‌کند."}
          </p>
        </div>
      </section>
      <section className="relative z-10 bg-paper pb-16 pt-10 sm:pt-12">
        <div className="px-4 sm:px-6">
          <ConsultAuthGate initialLawyer={lawyer} initialService={initialService} />
        </div>
      </section>
    </>
  );
}
