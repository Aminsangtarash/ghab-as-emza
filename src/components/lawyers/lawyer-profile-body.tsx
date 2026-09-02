import { ArticleCard } from "@/components/articles/article-card";
import { Stars } from "@/components/lawyers/stars";
import {
  relatedLawyerArticles,
  sharedLawyerProfile,
  lawyerSpecialties,
  type Lawyer,
} from "@/lib/data";
import { toFaDigits } from "@/lib/format";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy/8 sm:p-8">
      <span className="mb-3 block h-1 w-10 rounded-full bg-gold" />
      <h2 className="font-heading text-2xl font-bold text-navy">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function LawyerProfileBody({ lawyer }: { lawyer: Lawyer }) {
  const specialties = lawyerSpecialties(lawyer);
  const articles = relatedLawyerArticles();

  return (
    <div className="space-y-6">
      <Section title="درباره وکیل">
        <p className="text-sm leading-8 text-navy/75 sm:text-base">{lawyer.bio}</p>
      </Section>

      <Section title="سوابق و تجربه">
        <ol className="space-y-5">
          {sharedLawyerProfile.resume.map((item) => (
            <li key={item.title} className="relative flex gap-4 ps-2">
              <span className="mt-2 size-2.5 shrink-0 rounded-full bg-gold ring-4 ring-gold/15" />
              <div>
                <p className="text-xs font-medium text-gold-deep">{item.period}</p>
                <h3 className="mt-1 font-heading font-semibold text-navy">{item.title}</h3>
                <p className="mt-1 text-sm leading-7 text-navy/65">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="تخصص‌ها">
        <ul className="flex flex-wrap gap-2">
          {specialties.map((item) => (
            <li
              key={item}
              className="rounded-full bg-paper px-3.5 py-1.5 text-sm text-navy ring-1 ring-navy/10"
            >
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="نظرات موکلین">
        <ul className="space-y-4">
          {sharedLawyerProfile.reviews.map((review) => (
            <li key={`${review.name}-${review.date}`} className="rounded-2xl bg-paper p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-navy">{review.name}</p>
                <p className="text-xs text-navy/50">{review.date}</p>
              </div>
              <p className="mt-2 inline-flex items-center gap-2 text-sm">
                <Stars rating={review.rating} />
                <span className="text-navy/70">{toFaDigits(review.rating.toFixed(1))}</span>
              </p>
              <p className="mt-2 text-sm leading-7 text-navy/70">{review.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="مقالات مرتبط">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </Section>
    </div>
  );
}
