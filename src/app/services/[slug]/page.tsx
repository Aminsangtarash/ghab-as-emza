import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { ServiceIcon } from "@/components/services/service-icon";
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
        <PageHero title="خدمت یافت نشد" description="این دسته در فهرست خدمات نیست." />
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
        {category.groups.map((group) => (
          <div key={group.title} className="mb-12 last:mb-0">
            <h2 className="font-heading text-xl font-semibold text-navy">{group.title}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <Link
                  key={item.slug}
                  href={`/services/${category.slug}/${item.slug}`}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-navy/8 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-navy/5 text-navy">
                    <ServiceIcon name={category.icon} className="size-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-navy">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-navy/65">{item.short}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold-deep">
                    ثبت درخواست
                    <ChevronLeftIcon className="size-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
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
