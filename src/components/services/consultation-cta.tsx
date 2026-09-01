import Link from "next/link";
import { HeadsetIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConsultationCta() {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/images/cta-legal.jpg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-l from-navy-deep via-navy/95 to-navy/90"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6 sm:py-12">
        <div className="text-center sm:text-start">
          <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">
            نیاز به مشاوره دارید؟
          </h2>
          <p className="mt-2 max-w-md text-sm leading-7 text-white/75 sm:text-base">
            همین حالا با وکلای متخصص ما گفتگو کنید و بهترین راه‌حل حقوقی را دریافت کنید.
          </p>
        </div>
        <Link
          href="/consult"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 shrink-0 gap-2 bg-gold px-7 text-base text-navy-deep hover:bg-gold-bright",
          )}
        >
          <HeadsetIcon className="size-5" />
          مشاوره آنلاین
        </Link>
      </div>
    </section>
  );
}
