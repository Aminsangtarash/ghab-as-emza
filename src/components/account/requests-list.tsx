import Link from "next/link";
import { PlusIcon, ScaleIcon } from "lucide-react";

import { RequestCard } from "@/components/account/request-card";
import { buttonVariants } from "@/components/ui/button";
import type { ClientConsultation } from "@/lib/store";
import { cn } from "@/lib/utils";

export function RequestsList({ items }: { items: ClientConsultation[] }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gold-deep">پیگیری</p>
          <span className="mt-3 block h-1 w-12 rounded-full bg-gold" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-navy">درخواست‌ها</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-navy/65">
            هر درخواست پس از ثبت، خودکار اینجا می‌آید. پس از تأیید وکیل، از جزئیات درخواست یا از منوی گفتگوها وارد همان گفتگو شوید.
          </p>
        </div>
        <Link
          href="/account/consult"
          className={cn(buttonVariants({ size: "lg" }), "h-11 bg-gold px-5 text-navy-deep hover:bg-gold-bright")}
        >
          <PlusIcon className="size-4" />
          درخواست جدید
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-gold/20 bg-white/70 px-5 py-12 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
            <ScaleIcon className="size-5" />
          </span>
          <p className="mt-4 font-heading font-semibold text-navy">لیست خالی است</p>
          <p className="mt-2 text-sm leading-7 text-navy/60">اولین مشاوره را ثبت کنید تا در این فهرست دیده شود.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {items.map((item) => (
            <RequestCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
