import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { ServiceCategoryItems } from "@/components/request/request-service-button";
import { buttonVariants } from "@/components/ui/button";
import { catalogCategories, getCatalogCategory } from "@/lib/legal-catalog";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return catalogCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCatalogCategory(slug);
  if (!category) return { title: "خدمت یافت نشد" };
  return { title: category.title, description: category.short };
}

export default async function ServiceCategoryPage({
  params,
}: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const category = getCatalogCategory(slug);
  if (!category) {
    return (
      <>
        <PageHero title="خدمت یافت نشد" description="این موضوع در فهرست خدمات نیست." />
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Link href="/services" className="text-sm text-gold-deep hover:underline">
            بازگشت به خدمات
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero title={category.title} description={category.description} />
      <section className="mx-auto w-full max-w-6xl px-4 py-12 pt-10 sm:px-6 sm:pt-12">
        <ServiceCategoryItems category={category} />
        <Link
          href="/learn"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 border-navy/15")}
        >
          مطالعه در مرکز آموزش
        </Link>
      </section>
    </>
  );
}
