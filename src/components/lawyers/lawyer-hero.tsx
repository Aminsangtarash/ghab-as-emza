import Image from "next/image";
import Link from "next/link";
import { MapPinIcon } from "lucide-react";

import { Stars } from "@/components/lawyers/stars";
import type { Lawyer } from "@/lib/data";
import { toFaDigits } from "@/lib/format";

export function LawyerHero({ lawyer }: { lawyer: Lawyer }) {
  return (
    <section className="relative overflow-hidden bg-navy-deep">
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
        <Link href="/lawyers" className="text-sm text-gold hover:text-gold-bright">
          بازگشت به فهرست وکلا
        </Link>
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="relative size-36 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15 sm:size-44">
            <Image
              src={lawyer.image}
              alt={lawyer.name}
              fill
              priority
              className="object-cover object-top"
              sizes="176px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gold">{lawyer.title}</p>
            <h1 className="mt-1 font-heading text-3xl font-bold text-white sm:text-4xl">
              {lawyer.name}
            </h1>
            <p className="mt-2 text-white/75">{lawyer.specialty}</p>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <Stars rating={lawyer.rating} />
                {toFaDigits(lawyer.rating.toFixed(1))}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-3.5" />
                {lawyer.city}
              </span>
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3 lg:w-80">
            {[
              { label: "سال سابقه", value: toFaDigits(lawyer.years) },
              { label: "مشاوره", value: toFaDigits(lawyer.consultations) },
              { label: "امتیاز", value: toFaDigits(lawyer.rating.toFixed(1)) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/8 px-3 py-3 text-center ring-1 ring-white/10"
              >
                <dt className="text-[11px] text-white/55">{item.label}</dt>
                <dd className="mt-1 font-heading text-base font-semibold text-gold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
