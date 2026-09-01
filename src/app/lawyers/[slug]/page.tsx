import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPinIcon } from "lucide-react";

import { LawyerAvatar } from "@/components/lawyers/lawyer-avatar";
import { Stars } from "@/components/lawyers/stars";
import { buttonVariants } from "@/components/ui/button";
import { getLawyer, lawyers } from "@/lib/data";
import { toFaDigits } from "@/lib/format";
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
    <section className="relative z-10 bg-paper pb-16">
      <div className="bg-navy-deep text-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-14">
          <Link href="/lawyers" className="text-sm text-gold hover:text-gold-bright">
            بازگشت به فهرست وکلا
          </Link>
          <div className="mt-6 flex items-center gap-4">
            <LawyerAvatar src={lawyer.image} name={lawyer.name} className="size-20" size={160} />
            <div>
              <h1 className="font-heading text-3xl font-bold sm:text-4xl">{lawyer.name}</h1>
              <p className="mt-2 text-white/75">
                {lawyer.title} · {lawyer.specialty}
              </p>
            </div>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <Stars rating={lawyer.rating} />
              {toFaDigits(lawyer.rating.toFixed(1))}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon className="size-3.5" />
              {lawyer.city}
            </span>
            <span>{lawyer.experience} سابقه</span>
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm leading-8 text-navy/80 sm:text-base">{lawyer.bio}</p>
        <h2 className="mt-8 font-heading text-lg font-semibold text-navy">حوزه‌های تمرکز</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {lawyer.focus.map((item) => (
            <li key={item} className="rounded-full bg-white px-3 py-1 text-sm text-navy ring-1 ring-navy/10">
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/consult"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 h-11 bg-gold px-6 text-navy-deep hover:bg-gold-bright",
          )}
        >
          درخواست مشاوره با این تخصص
        </Link>
      </div>
    </section>
  );
}
