"use client";

import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

export function ArticlesHero({
  query,
  onQuery,
}: {
  query: string;
  onQuery: (value: string) => void;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-deep">
      <div
        className="absolute inset-0 bg-cover bg-left opacity-25"
        style={{ backgroundImage: "url('/images/hero-legal.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-navy-deep via-navy-deep/92 to-navy/80" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            مقالات حقوقی
          </h1>
          <p className="mt-3 text-base font-medium text-gold">
            دانش حقوقی خود را افزایش دهید
          </p>
          <p className="mt-3 max-w-lg text-sm leading-7 text-white/75 sm:text-base">
            مقالات آموزشی و تحلیلی برای تصمیم بهتر قبل از امضا؛ از قرارداد و خانواده تا دعاوی تجاری.
          </p>
        </div>
        <label className="relative block w-full max-w-md">
          <span className="sr-only">جستجو در مقالات</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-navy/40" />
          <Input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="جستجو در مقالات..."
            className="h-14 rounded-2xl border-0 bg-white pr-12 text-base shadow-lg"
          />
        </label>
      </div>
    </section>
  );
}
