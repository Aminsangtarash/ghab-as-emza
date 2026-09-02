import Link from "next/link";
import { ClipboardListIcon, PlusIcon } from "lucide-react";

import { RequestCard } from "@/components/account/request-card";
import { buttonVariants } from "@/components/ui/button";
import { consultationStatusMeta } from "@/lib/consult";
import { toFaDigits } from "@/lib/format";
import type { ClientConsultation, PublicUser } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AccountOverview({
  user,
  items,
}: {
  user: PublicUser;
  items: ClientConsultation[];
}) {
  const pending = items.filter((item) => item.status !== "closed").length;
  const latest = items[0];

  return (
    <div>
      <p className="text-sm font-medium text-gold-deep">پنل کاربری</p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-navy sm:text-3xl">
        سلام، {user.fullName}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/65">
        وضعیت درخواست‌ها، ثبت مشاوره جدید و اطلاعات حساب از همین‌جا در دسترس است.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <StatCard label="کل درخواست‌ها" value={toFaDigits(items.length)} />
        <StatCard label="در حال پیگیری" value={toFaDigits(pending)} />
        <StatCard
          label="آخرین وضعیت"
          value={latest ? consultationStatusMeta[latest.status].title : "هنوز درخواستی نیست"}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-navy">آخرین درخواست‌ها</h2>
        <Link
          href="/account/consult"
          className={cn(buttonVariants({ size: "lg" }), "h-10 bg-navy px-4 text-white hover:bg-navy-mid")}
        >
          <PlusIcon className="size-4" />
          ثبت درخواست
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyRequests />
      ) : (
        <div className="mt-4 space-y-3">
          {items.slice(0, 4).map((item) => (
            <RequestCard key={item.id} item={item} />
          ))}
          {items.length > 4 && (
            <Link
              href="/account/requests"
              className="inline-flex items-center gap-2 text-sm font-medium text-gold-deep hover:underline"
            >
              <ClipboardListIcon className="size-4" />
              مشاهده همه درخواست‌ها
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper p-4 ring-1 ring-navy/8">
      <p className="text-xs font-medium text-navy/50">{label}</p>
      <p className="mt-2 font-heading text-lg font-semibold text-navy">{value}</p>
    </div>
  );
}

function EmptyRequests() {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-navy/15 bg-paper px-5 py-10 text-center">
      <p className="font-heading text-base font-semibold text-navy">هنوز درخواستی ثبت نشده</p>
      <p className="mt-2 text-sm leading-7 text-navy/60">
        با ثبت اولین درخواست، وضعیت و کد پیگیری همین‌جا نمایش داده می‌شود.
      </p>
      <Link
        href="/account/consult"
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-5 inline-flex h-10 bg-navy px-4 text-white hover:bg-navy-mid",
        )}
      >
        شروع ثبت درخواست
      </Link>
    </div>
  );
}
