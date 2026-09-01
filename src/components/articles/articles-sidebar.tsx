import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseIcon,
  FileTextIcon,
  GavelIcon,
  LandmarkIcon,
  ScaleIcon,
  ScrollTextIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";

import { NewsletterForm } from "@/components/articles/newsletter-form";
import { articleCategoryCounts, popularArticles, type Article } from "@/lib/data";
import { toFaDigits } from "@/lib/format";

const categoryIcons: Record<string, typeof FileTextIcon> = {
  "حقوقی عمومی": LandmarkIcon,
  قراردادها: FileTextIcon,
  خانواده: UsersIcon,
  تجاری: BriefcaseIcon,
  کیفری: GavelIcon,
  "ارث و وصیت": ScrollTextIcon,
  امنیت: ShieldIcon,
};

export function ArticlesSidebar({
  activeCategory,
  onCategory,
}: {
  activeCategory: string;
  onCategory: (category: string) => void;
}) {
  const popular = popularArticles();
  const counts = articleCategoryCounts().filter((item) => item.count > 0);

  return (
    <aside className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-navy/8">
        <h3 className="font-heading text-base font-bold text-navy">دسته‌بندی مقالات</h3>
        <ul className="mt-4 space-y-1">
          {counts.map(({ category, count }) => {
            const Icon = categoryIcons[category] ?? ScaleIcon;
            const active = activeCategory === category;
            return (
              <li key={category}>
                <button
                  type="button"
                  onClick={() => onCategory(active ? "all" : category)}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition ${
                    active
                      ? "bg-navy text-white"
                      : "text-navy/80 hover:bg-navy/5"
                  }`}
                >
                  <Icon className={`size-4 ${active ? "text-gold" : "text-gold-deep"}`} />
                  <span className="flex-1 text-start">{category}</span>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-[11px] ${
                      active ? "bg-white/15 text-white" : "bg-navy/8 text-navy/70"
                    }`}
                  >
                    {toFaDigits(count)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => onCategory("all")}
          className="mt-3 text-sm font-medium text-gold-deep hover:text-navy"
        >
          مشاهده همه دسته‌ها
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-navy/8">
        <h3 className="font-heading text-base font-bold text-navy">پربازدیدترین مقالات</h3>
        <ul className="mt-4 space-y-4">
          {popular.map((article: Article) => (
            <li key={article.slug}>
              <Link href={`/articles/${article.slug}`} className="flex gap-3">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </span>
                <span>
                  <span className="block font-heading text-sm font-semibold leading-6 text-navy hover:text-gold-deep">
                    {article.title}
                  </span>
                  <span className="mt-1 block text-xs text-navy/50">{article.date}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <NewsletterForm />
    </aside>
  );
}
