"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { LawyerCard } from "@/components/lawyers/lawyer-card";
import { Input } from "@/components/ui/input";
import { SiteSelect } from "@/components/ui/site-select";
import { lawyers } from "@/lib/data";

const specialtyOptions = [
  { value: "all", label: "همه تخصص‌ها" },
  ...Array.from(new Set(lawyers.map((item) => item.specialty))).map((specialty) => ({
    value: specialty,
    label: specialty,
  })),
];

const cityOptions = [
  { value: "all", label: "همه شهرها" },
  ...Array.from(new Set(lawyers.map((item) => item.city))).map((city) => ({
    value: city,
    label: city,
  })),
];

const sortOptions = [
  { value: "rating", label: "بالاترین امتیاز" },
  { value: "experience", label: "بیشترین سابقه" },
  { value: "name", label: "نام" },
];

export function LawyersExplorer() {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [city, setCity] = useState("all");
  const [sort, setSort] = useState("rating");

  const visible = useMemo(() => {
    const needle = query.trim();
    const list = lawyers.filter((lawyer) => {
      const matchesQuery =
        !needle ||
        lawyer.name.includes(needle) ||
        lawyer.specialty.includes(needle) ||
        lawyer.city.includes(needle);
      const matchesSpecialty = specialty === "all" || lawyer.specialty === specialty;
      const matchesCity = city === "all" || lawyer.city === city;
      return matchesQuery && matchesSpecialty && matchesCity;
    });

    return list.sort((a, b) => {
      if (sort === "experience") return b.years - a.years;
      if (sort === "name") return a.name.localeCompare(b.name, "fa");
      return b.rating - a.rating;
    });
  }, [city, query, sort, specialty]);

  return (
    <section className="relative z-10 bg-paper py-12 sm:py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy/8 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,11rem))]">
            <label className="relative">
              <span className="sr-only">جستجوی وکیل</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-navy/40" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="نام وکیل یا تخصص..."
                className="h-10 rounded-xl border-navy/12 bg-paper pr-11"
              />
            </label>
            <SiteSelect
              value={specialty}
              onValueChange={setSpecialty}
              options={specialtyOptions}
              placeholder="تخصص"
            />
            <SiteSelect
              value={city}
              onValueChange={setCity}
              options={cityOptions}
              placeholder="شهر"
            />
            <SiteSelect
              value={sort}
              onValueChange={setSort}
              options={sortOptions}
              placeholder="مرتب‌سازی"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-navy/8">
            <p className="font-heading text-lg font-semibold text-navy">وکیلی پیدا نشد</p>
            <p className="mt-2 text-sm text-navy/60">جستجو یا فیلتر را تغییر دهید.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((lawyer) => (
              <LawyerCard key={lawyer.slug} lawyer={lawyer} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
