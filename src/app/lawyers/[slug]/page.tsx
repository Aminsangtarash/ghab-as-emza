import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LawyerHero } from "@/components/lawyers/lawyer-hero";
import { LawyerProfileBody } from "@/components/lawyers/lawyer-profile-body";
import { buttonVariants } from "@/components/ui/button";
import { getLawyer, lawyers } from "@/lib/data";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return lawyers.map((lawyer) => ({ slug: lawyer.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/lawyers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lawyer = getLawyer(slug);
  if (!lawyer) return { title: "متخصص یافت نشد" };
  return { title: lawyer.name, description: lawyer.bio };
}

export default async function LawyerPage({ params }: PageProps<"/lawyers/[slug]">) {
  const { slug } = await params;
  const lawyer = getLawyer(slug);
  if (!lawyer) notFound();

  return (
    <>
      <LawyerHero lawyer={lawyer} />
      <section className="relative z-10 bg-paper pb-16 pt-10 sm:pt-12">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <LawyerProfileBody lawyer={lawyer} />
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-navy/8">
              <span className="mb-3 block h-1 w-10 rounded-full bg-gold" />
              <h2 className="font-heading text-xl font-bold text-navy">درخواست مشاوره</h2>
              <p className="mt-2 text-sm leading-7 text-navy/65">
                موضوع را برای {lawyer.name} از مسیر رسمی ثبت کنید.
              </p>
              <Link
                href={`/consult?lawyer=${lawyer.slug}`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-5 h-11 w-full bg-gold text-navy-deep hover:bg-gold-bright",
                )}
              >
                ادامه به فرم مشاوره
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
