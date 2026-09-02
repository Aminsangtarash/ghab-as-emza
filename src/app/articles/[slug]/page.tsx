import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3Icon } from "lucide-react";

import { articles, getArticle } from "@/lib/data";
import { toFaDigits } from "@/lib/format";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "مقاله یافت نشد" };
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <article className="relative z-10 bg-paper pb-16">
      <section className="bg-navy-deep text-white">
        <div className="mx-auto w-full max-w-3xl px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-14">
          <Link href="/articles" className="text-sm text-gold hover:text-gold-bright">
            بازگشت به مقالات
          </Link>
          <p className="mt-5 text-sm text-gold">{article.category}</p>
          <h1 className="mt-2 font-heading text-3xl font-bold leading-snug sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
            <span>{article.date}</span>
            <span className="inline-flex items-center gap-1">
              <Clock3Icon className="size-3.5" />
              {toFaDigits(article.readMinutes)} دقیقه مطالعه
            </span>
          </p>
        </div>
      </section>
      <div className="mx-auto w-full max-w-3xl px-4 pt-10 sm:px-6 sm:pt-12">
        <div className="relative mb-8 h-64 overflow-hidden rounded-2xl shadow-lg sm:h-80">
          <Image src={article.image} alt="" fill className="object-cover" sizes="768px" />
        </div>
        <div className="space-y-5 text-sm leading-8 text-navy/85 sm:text-base">
          {article.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
