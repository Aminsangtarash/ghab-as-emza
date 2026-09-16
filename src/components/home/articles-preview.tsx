"use client";

import Link from "next/link";

import { ArticleCard } from "@/components/articles/article-card";
import { buttonVariants } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { featuredArticles } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ArticlesPreview() {
  const items = featuredArticles();

  return (
    <section className="relative z-10 bg-white py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-gold-deep">دانش حقوقی</p>
              <h2 className="mt-2 font-heading text-2xl font-bold text-navy sm:text-3xl">
                آخرین مقالات
              </h2>
            </div>
            <Link
              href="/articles"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 border-navy/20 text-navy",
              )}
            >
              همه مقالات
            </Link>
          </div>
        </ScrollReveal>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((article, index) => (
            <ScrollReveal key={article.slug} delay={index * 100}>
              <ArticleCard article={article} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
