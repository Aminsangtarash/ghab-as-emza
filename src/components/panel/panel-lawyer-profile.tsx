import Link from "next/link";
import { MapPinIcon } from "lucide-react";

import { LawyerAvatar } from "@/components/lawyers/lawyer-avatar";
import { LawyerProfileBody } from "@/components/lawyers/lawyer-profile-body";
import { Stars } from "@/components/lawyers/stars";
import { PanelHeading } from "@/components/panel/panel-heading";
import { buttonVariants } from "@/components/ui/button";
import type { Lawyer } from "@/lib/data";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PanelLawyerProfile({
  lawyer,
  backHref,
  consultHref,
}: {
  lawyer: Lawyer;
  backHref: string;
  consultHref: string;
}) {
  return (
    <div>
      <Link href={backHref} className="text-sm font-medium text-gold-deep hover:underline">
        بازگشت به فهرست وکلا
      </Link>
      <div className="mt-5">
        <PanelHeading kicker={lawyer.title} title={lawyer.name} description={lawyer.specialty} />
      </div>

      <div className="mt-8 overflow-hidden rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-navy/8 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <LawyerAvatar src={lawyer.image} name={lawyer.name} className="size-24 sm:size-28" size={224} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gold-deep">{lawyer.specialty}</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-navy">{lawyer.name}</h2>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-navy/65">
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
          <dl className="grid grid-cols-3 gap-3 sm:w-72">
            {[
              { label: "سال سابقه", value: toFaDigits(lawyer.years) },
              { label: "مشاوره", value: toFaDigits(lawyer.consultations) },
              { label: "امتیاز", value: toFaDigits(lawyer.rating.toFixed(1)) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-paper px-3 py-3 text-center ring-1 ring-navy/8">
                <dt className="text-[11px] text-navy/45">{item.label}</dt>
                <dd className="mt-1 font-heading text-base font-semibold text-navy">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Link
          href={consultHref}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-6 h-11 w-full bg-gold text-navy-deep hover:bg-gold sm:w-auto sm:px-6",
          )}
        >
          ثبت مشاوره با این وکیل
        </Link>
      </div>

      <div className="mt-8">
        <LawyerProfileBody lawyer={lawyer} />
      </div>
    </div>
  );
}
