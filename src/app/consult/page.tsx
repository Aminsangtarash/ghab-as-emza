import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { OpenServiceRequest, RequestServiceCta } from "@/components/request/request-service-button";
import { getCatalogItem } from "@/lib/legal-catalog";

export async function generateMetadata({
  searchParams,
}: PageProps<"/consult">): Promise<Metadata> {
  const params = await searchParams;
  const serviceSlug = typeof params.service === "string" ? params.service : undefined;
  const item = serviceSlug ? getCatalogItem(serviceSlug) : undefined;
  if (item) {
    return { title: `ثبت درخواست ${item.title}`, description: item.short };
  }
  return {
    title: "ثبت درخواست حقوقی",
    description: "موضوع را انتخاب کنید و درخواست را برای بررسی مدیر ثبت کنید.",
  };
}

export default async function ConsultPage({ searchParams }: PageProps<"/consult">) {
  const params = await searchParams;
  const serviceSlug = typeof params.service === "string" ? params.service : undefined;
  const item = serviceSlug ? getCatalogItem(serviceSlug) : undefined;

  if (item) {
    return (
      <>
        <OpenServiceRequest serviceSlug={item.slug} />
        <PageHero title={item.title} description="درخواست ابتدا به مدیر می‌رسد و سپس به وکیل مناسب سپرده می‌شود." />
        <section className="relative z-10 mx-auto max-w-3xl bg-paper px-4 pb-16 pt-10 sm:px-6 sm:pt-12">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy/8 sm:p-8">
            <p className="text-sm leading-7 text-navy/70">
              عنوان و یک توضیح کوتاه کافی است. درخواست با شماره حساب شما ثبت می‌شود.
            </p>
            <RequestServiceCta serviceSlug={item.slug} label="ثبت درخواست" className="mt-5" />
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        title="ثبت درخواست"
        description="ابتدا موضوع را انتخاب کنید تا فرم کوتاه برایتان باز شود."
      />
      <section className="relative z-10 bg-paper px-4 pb-16 pt-10 text-center sm:pt-12">
        <Link href="/services" className="text-sm font-medium text-gold-deep hover:underline">
          رفتن به فهرست خدمات
        </Link>
      </section>
    </>
  );
}
