"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { learnArticles, getLearnCategory } from "@/lib/education-data";
import { cn } from "@/lib/utils";

export function ArticlesPreview() {
  const items = learnArticles.slice(0, 3);

  return (
    <section className="relative z-10 bg-white py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-gold-deep">مرکز آموزش</p>
              <h2 className="mt-2 font-heading text-2xl font-bold text-navy sm:text-3xl">
                سوالات پرتکرار حقوقی
              </h2>
            </div>
            <Link
              href="/learn"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 border-navy/20 text-navy")}
            >
              ورود به آکادمی
            </Link>
          </div>
        </ScrollReveal>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((article, index) => (
            <ScrollReveal key={article.slug} delay={index * 100}>
              <Card className="h-full border border-navy/8 bg-white py-0 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <CardContent className="flex h-full flex-col p-6">
                  <p className="text-xs font-medium text-gold-deep">
                    {getLearnCategory(article.categorySlug)?.title}
                  </p>
                  <h3 className="mt-2 font-heading text-base font-bold leading-7 text-navy">
                    {article.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-navy/65">{article.answer}</p>
                  <Link
                    href={`/learn/${article.categorySlug}/${article.slug}`}
                    className="mt-4 text-sm font-medium text-navy hover:text-gold-deep"
                  >
                    خواندن پاسخ کامل
                  </Link>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
