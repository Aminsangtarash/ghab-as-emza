import Link from "next/link";
import { CalendarDaysIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatToman } from "@/lib/format";
import { getService } from "@/lib/data";
import { cn } from "@/lib/utils";

/** فاز ۲ کامل رزرو تقویمی هنوز نیامده؛ لندینگ ثبت علاقه‌مندی/مسیر موقت. */
export function InPersonConsultStub() {
  const service = getService("in-person");
  return (
    <div className="mx-auto max-w-2xl rounded-[1.35rem] border border-navy/10 bg-white p-6 text-center shadow-sm sm:p-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-navy/8 text-navy">
        <CalendarDaysIcon className="size-6" />
      </span>
      <h2 className="mt-5 font-heading text-2xl font-bold text-navy">رزرو نوبت حضوری</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-navy/65">
        انتخاب تاریخ و ساعت دفتر به‌زودی فعال می‌شود. فعلاً می‌توانید از مشاوره آنلاین یا فوری شروع
        کنید، یا پس از گفتگو از وکیل بخواهید نوبت حضوری برایتان ثبت کند.
      </p>
      {service ? (
        <p className="mt-4 text-sm text-navy/50">بیعانه پیش‌بینی‌شده: {formatToman(service.feeToman)}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/consult?service=urgent-consult"
          className={cn(buttonVariants(), "h-11 bg-gold px-5 text-navy-deep hover:bg-gold-bright")}
        >
          مشاوره فوری
        </Link>
        <Link
          href="/consult?service=consultation"
          className={cn(buttonVariants({ variant: "outline" }), "h-11 border-navy/15 px-5")}
        >
          مشاوره آنلاین
        </Link>
      </div>
    </div>
  );
}
