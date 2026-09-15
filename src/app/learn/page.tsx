import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { learnArticles, learnCategories } from "@/lib/education-data";
import { toFaDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "مرکز آموزش حقوقی",
  description: "آکادمی آموزش حقوقی با زبان ساده؛ سوالات پرتکرار، راهنمای اقدام و اتصال به خدمات.",
};

export default function LearnPage() {
  return (
    <>
      <PageHero
        title="مرکز آموزش"
        description="پاسخ سوالات رایج به زبان ساده؛ اگر نیاز به اقدام دارید، از همان صفحه درخواست ثبت کنید."
      />
      <section className="mx-auto w-full max-w-6xl px-4 py-12 pt-10 sm:px-6 sm:pt-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {learnCategories.map((category) => {
            const count = learnArticles.filter((item) => item.categorySlug === category.slug).length;
            return (
              <Link
                key={category.slug}
                href={`/learn/${category.slug}`}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/8 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h2 className="font-heading text-lg font-bold text-navy">{category.title}</h2>
                <p className="mt-2 text-sm leading-7 text-navy/65">{category.short}</p>
                <p className="mt-4 text-xs text-navy/45">{toFaDigits(count)} مطلب</p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
