import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { RequestCard } from "@/components/account/request-card";
import { buttonVariants } from "@/components/ui/button";
import type { ClientConsultation } from "@/lib/store";
import { cn } from "@/lib/utils";

export function RequestsList({ items }: { items: ClientConsultation[] }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gold-deep">پیگیری</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-navy">درخواست‌ها</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-navy/65">
            هر درخواست پس از ثبت، خودکار اینجا می‌آید. وضعیت، جزئیات و کد پیگیری را از همین فهرست ببینید.
          </p>
        </div>
        <Link
          href="/account/consult"
          className={cn(buttonVariants({ size: "lg" }), "h-10 bg-navy px-4 text-white hover:bg-navy-mid")}
        >
          <PlusIcon className="size-4" />
          درخواست جدید
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-navy/15 bg-paper px-5 py-10 text-center">
          <p className="font-heading font-semibold text-navy">لیست خالی است</p>
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
