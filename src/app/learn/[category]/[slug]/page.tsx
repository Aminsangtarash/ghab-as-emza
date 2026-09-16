import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/page-hero";
import { RequestServiceCta } from "@/components/request/request-service-button";
import { buttonVariants } from "@/components/ui/button";
import {
  getLearnArticle,
  getLearnCategory,
  relatedLearnArticles,
} from "@/lib/education-data";
import { getCatalogItem, servicePath } from "@/lib/legal-catalog";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearnArticle(slug);
  if (!article) return { title: "مطلب یافت نشد" };
  return { title: article.title, description: article.excerpt };
}

export default async function LearnArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const article = getLearnArticle(slug);
  const cat = getLearnCategory(category);
  if (!article || !cat || article.categorySlug !== category) notFound();
  const related = relatedLearnArticles(article);
  const service = getCatalogItem(article.relatedServiceSlug);
  const requestHref = service
    ? servicePath(service.categorySlug, service.slug)
    : `/services/${cat.relatedServiceSlug}`;

  const sections = [
    { title: "شرح کوتاه مسئله", body: article.issue },
    { title: "پاسخ ساده", body: article.answer },
    { title: "شرایط و استثناها", body: article.exceptions },
    { title: "مدارک مورد نیاز", body: article.documents },
    { title: "مرجع یا مسیر اقدام", body: article.actionPath },
    { title: "هشدارهای مهم", body: article.warnings },
  ];

  return (
    <>
      <PageHero title={article.title} description={cat.title} />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 pt-10 sm:px-6 sm:pt-12 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy/8 sm:p-8">
          {sections.map((section) => (
            <section key={section.title} className="mb-8 last:mb-0">
              <h2 className="font-heading text-lg font-semibold text-navy">{section.title}</h2>
              <p className="mt-2 text-sm leading-8 text-navy/75">{section.body}</p>
            </section>
          ))}
        </article>
        <aside className="space-y-5">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy/8">
            <h2 className="font-heading text-lg font-semibold text-navy">پیشنهاد خدمت مرتبط</h2>
            <p className="mt-2 text-sm leading-7 text-navy/65">
              اگر نیاز به بررسی دقیق پرونده دارید، درخواست {article.relatedServiceLabel} را ثبت کنید. اگر نیاز به تنظیم
              متن دارید، از بخش اوراق قضایی استفاده کنید.
            </p>
            {service ? (
              <RequestServiceCta
                serviceSlug={service.slug}
                label={`ثبت درخواست ${article.relatedServiceLabel}`}
                className="mt-5"
              />
            ) : (
              <Link
                href={requestHref}
                className={cn(buttonVariants(), "mt-5 bg-gold text-navy-deep hover:bg-gold-bright")}
              >
                ثبت درخواست {article.relatedServiceLabel}
              </Link>
            )}
          </div>
          {related.length > 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy/8">
              <h2 className="font-heading text-base font-semibold text-navy">مطالب مرتبط</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/learn/${item.categorySlug}/${item.slug}`}
                      className="text-navy/75 hover:text-gold-deep"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </section>
    </>
  );
}
