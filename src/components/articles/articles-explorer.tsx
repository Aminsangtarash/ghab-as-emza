"use client";

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { ArticleCard } from "@/components/articles/article-card";
import { ArticlesHero } from "@/components/articles/articles-hero";
import { ArticlesSidebar } from "@/components/articles/articles-sidebar";
import { SiteSelect } from "@/components/ui/site-select";
import { articleCategories, articles } from "@/lib/data";
import { toEnDigits, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

function sortKey(date: string) {
  return toEnDigits(date).replaceAll("/", "");
}

export function ArticlesExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim();
    const list = articles.filter((article) => {
      const matchesCategory = category === "all" || article.category === category;
      const matchesQuery =
        !needle ||
        article.title.includes(needle) ||
        article.excerpt.includes(needle) ||
        article.category.includes(needle);
      return matchesCategory && matchesQuery;
    });

    return list.sort((a, b) => {
      const diff = sortKey(b.date).localeCompare(sortKey(a.date));
      return sort === "newest" ? diff : -diff;
    });
  }, [category, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function changeCategory(next: string) {
    setCategory(next);
    setPage(1);
  }

  function changeQuery(next: string) {
    setQuery(next);
    setPage(1);
  }

  return (
    <>
      <ArticlesHero query={query} onQuery={changeQuery} />
      <section className="relative z-10 bg-paper py-12 sm:py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[18.5rem_minmax(0,1fr)]">
          <div className="lg:col-start-2">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => changeCategory("all")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    category === "all"
                      ? "bg-navy text-white"
                      : "bg-white text-navy/70 ring-1 ring-navy/10 hover:text-navy",
                  )}
                >
                  همه مقالات
                </button>
                {articleCategories.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => changeCategory(item)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      category === item
                        ? "bg-navy text-white"
                        : "bg-white text-navy/70 ring-1 ring-navy/10 hover:text-navy",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-3 text-sm text-navy/70">
                <span className="shrink-0">مرتب‌سازی</span>
                <SiteSelect
                  value={sort}
                  className="w-40"
                  onValueChange={(next) => {
                    setSort(next as "newest" | "oldest");
                    setPage(1);
                  }}
                  options={[
                    { value: "newest", label: "جدیدترین" },
                    { value: "oldest", label: "قدیمی‌ترین" },
                  ]}
                />
              </label>
            </div>

            {visible.length === 0 ? (
              <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-navy/8">
                <p className="font-heading text-lg font-semibold text-navy">مقاله‌ای پیدا نشد</p>
                <p className="mt-2 text-sm text-navy/60">جستجو یا دسته را تغییر دهید.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {visible.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            )}

            {pageCount > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-1.5"
                aria-label="صفحه‌بندی مقالات"
              >
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="inline-flex h-10 items-center gap-1 rounded-xl bg-white px-3 text-sm text-navy ring-1 ring-navy/10 disabled:opacity-40"
                >
                  <ChevronRightIcon className="size-4" />
                  قبلی
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setPage(item)}
                    className={cn(
                      "size-10 rounded-xl text-sm font-medium",
                      item === currentPage
                        ? "bg-navy text-white"
                        : "bg-white text-navy ring-1 ring-navy/10 hover:bg-navy/5",
                    )}
                  >
                    {toFaDigits(item)}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                  className="inline-flex h-10 items-center gap-1 rounded-xl bg-white px-3 text-sm text-navy ring-1 ring-navy/10 disabled:opacity-40"
                >
                  بعدی
                  <ChevronLeftIcon className="size-4" />
                </button>
              </nav>
            )}
          </div>
          <div className="lg:col-start-1 lg:row-start-1">
            <ArticlesSidebar activeCategory={category} onCategory={changeCategory} />
          </div>
        </div>
      </section>
    </>
  );
}
