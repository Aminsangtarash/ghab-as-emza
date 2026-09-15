import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { QuickRequestForm } from "@/components/request/quick-request-form";
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
        <PageHero title={item.title} description="درخواست ابتدا به مدیر می‌رسد و سپس به وکیل مناسب سپرده می‌شود." />
        <section className="relative z-10 mx-auto max-w-3xl bg-paper px-4 pb-16 pt-10 sm:px-6 sm:pt-12">
          <QuickRequestForm serviceSlug={item.slug} categoryTitle={item.categoryTitle} />
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        title="ثبت درخواست"
        description="ابتدا دسته و زیرشاخه را انتخاب کنید تا فرم کوتاه برایتان باز شود."
      />
      <section className="relative z-10 bg-paper px-4 pb-16 pt-10 text-center sm:pt-12">
        <Link href="/services" className="text-sm font-medium text-gold-deep hover:underline">
          رفتن به فهرست خدمات
        </Link>
      </section>
    </>
  );
}
