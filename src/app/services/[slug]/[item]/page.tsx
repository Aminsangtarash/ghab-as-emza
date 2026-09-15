import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/page-hero";
import { PrivacyPromise } from "@/components/privacy-promise";
import { QuickRequestForm } from "@/components/request/quick-request-form";
import { getCatalogCategory, getCatalogItem } from "@/lib/legal-catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; item: string }>;
}): Promise<Metadata> {
  const { item } = await params;
  const service = getCatalogItem(item);
  if (!service) return { title: "خدمت یافت نشد" };
  return { title: service.title, description: service.short };
}

export default async function ServiceItemPage({
  params,
}: {
  params: Promise<{ slug: string; item: string }>;
}) {
  const { slug, item } = await params;
  const category = getCatalogCategory(slug);
  const service = getCatalogItem(item);
  if (!category || !service || service.categorySlug !== slug) notFound();

  const learnHref = service.learnCategory
    ? `/learn/${service.learnCategory}`
    : "/learn";

  return (
    <>
      <PageHero title={service.title} description={service.short} />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 pt-10 sm:px-6 sm:pt-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-medium text-gold-deep">{category.title}</p>
          <h2 className="mt-3 font-heading text-2xl font-semibold text-navy">مسیر اقدام</h2>
          <ol className="mt-4 list-decimal space-y-2 pr-5 text-sm leading-7 text-navy/75">
            <li>شرح کوتاه موضوع را ثبت کنید.</li>
            <li>مدیر درخواست را می‌بیند و وکیل مناسب را مشخص می‌کند.</li>
            <li>نتیجه و هر تغییر پس از تأیید مدیر به شما اعلام می‌شود.</li>
          </ol>
          <PrivacyPromise className="mt-6" />
          <Link href={learnHref} className="mt-6 inline-block text-sm text-gold-deep hover:underline">
            مطالعه آموزش مرتبط در مرکز آموزش
          </Link>
        </div>
        <QuickRequestForm serviceSlug={service.slug} categoryTitle={category.title} />
      </section>
    </>
  );
}
