import Link from "next/link";
import { CalendarIcon, MapPinIcon } from "lucide-react";

import { LawyerAvatar } from "@/components/lawyers/lawyer-avatar";
import { Stars } from "@/components/lawyers/stars";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Lawyer } from "@/lib/data";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LawyerCard({ lawyer }: { lawyer: Lawyer }) {
  return (
    <Card className="h-full gap-0 py-0 ring-navy/8 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-start gap-4">
          <LawyerAvatar src={lawyer.image} name={lawyer.name} className="size-16" size={128} />
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold text-navy">{lawyer.name}</h2>
            <p className="mt-0.5 text-sm text-navy/60">{lawyer.title}</p>
            <p className="mt-1 text-sm font-medium text-gold-deep">{lawyer.specialty}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm">
          <Stars rating={lawyer.rating} />
          <span className="font-medium text-navy">{toFaDigits(lawyer.rating.toFixed(1))}</span>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-sm text-navy/65">
          <MapPinIcon className="size-3.5 shrink-0" />
          {lawyer.city} · {lawyer.experience} سابقه
        </p>

        <div className="mt-6 flex gap-2">
          <Link
            href={`/consult?lawyer=${lawyer.slug}`}
            className={cn(
              buttonVariants(),
              "h-10 flex-1 gap-1.5 bg-gold text-navy-deep hover:bg-gold-bright",
            )}
          >
            <CalendarIcon className="size-4" />
            رزرو مشاوره
          </Link>
          <Link
            href={`/lawyers/${lawyer.slug}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 flex-1 border-navy/15 text-navy hover:bg-navy/5",
            )}
          >
            مشاهده پروفایل
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
