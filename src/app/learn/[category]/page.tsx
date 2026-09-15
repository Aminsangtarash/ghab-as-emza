import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import {
  getLearnCategory,
  learnArticlesByCategory,
  learnCategories,
} from "@/lib/education-data";
import { getCatalogCategory } from "@/lib/legal-catalog";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return learnCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const item = getLearnCategory(category);
  if (!item) return { title: "دسته یافت نشد" };
  return { title: item.title, description: item.short };
}

export default async function LearnCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const item = getLearnCategory(category);
  if (!item) notFound();
  const articles = learnArticlesByCategory(category);
  const service = getCatalogCategory(item.relatedServiceSlug);

  return (
    <>
      <PageHero title={item.title} description={item.short} />
      <section className="mx-auto w-full max-w-6xl px-4 py-12 pt-10 sm:px-6 sm:pt-12">
        {service ? (
          <Link
            href={service.href}
            className={cn(buttonVariants(), "mb-8 bg-gold text-navy-deep hover:bg-gold-bright")}
          >
            ثبت درخواست در {service.title}
          </Link>
        ) : null}
        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/learn/${category}/${article.slug}`}
              className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-navy/8 hover:ring-gold/40"
            >
              <h2 className="font-heading text-base font-bold text-navy">{article.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-navy/65">{article.answer}</p>
            </Link>
          ))}
          {articles.length === 0 ? (
            <p className="text-sm text-navy/55">هنوز مطلبی در این دسته منتشر نشده است.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
