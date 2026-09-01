import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, Clock3Icon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { toFaDigits } from "@/lib/format";
import type { Article } from "@/lib/data";
import { cn } from "@/lib/utils";

const categoryTone: Record<string, string> = {
  قراردادها: "bg-gold text-navy-deep",
  خانواده: "bg-navy-mid text-white",
  تجاری: "bg-navy text-gold",
  کیفری: "bg-navy-deep text-white",
  "ارث و وصیت": "bg-gold-deep text-white",
  امنیت: "bg-navy text-white",
  "حقوقی عمومی": "bg-navy-mid text-gold",
};

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className="group h-full gap-0 overflow-hidden py-0 ring-navy/8 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/articles/${article.slug}`} className="flex h-full flex-col">
        <div className="relative h-44 overflow-hidden">
          <Image
            src={article.image}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 100vw"
          />
          <span
            className={cn(
              "absolute top-3 right-3 rounded-md px-2.5 py-1 text-[11px] font-medium",
              categoryTone[article.category] ?? "bg-gold text-navy-deep",
            )}
          >
            {article.category}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="inline-flex items-center gap-1.5 text-xs text-navy/55">
            <Clock3Icon className="size-3.5" />
            {toFaDigits(article.readMinutes)} دقیقه مطالعه
          </p>
          <h2 className="mt-2 font-heading text-base font-bold leading-7 text-navy group-hover:text-gold-deep">
            {article.title}
          </h2>
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-7 text-navy/65">
            {article.excerpt}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy">
            ادامه مطلب
            <ChevronLeftIcon className="size-4 transition group-hover:-translate-x-0.5" />
          </span>
        </div>
      </Link>
    </Card>
  );
}
