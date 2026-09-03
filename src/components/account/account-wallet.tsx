import { ArrowDownLeftIcon, PlusIcon, ReceiptIcon, WalletIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const card = "rounded-[1.25rem] border border-navy/20 bg-white text-navy shadow-sm";

export type WalletItem = {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
  note: string | null;
};

export function AccountWallet({
  balance,
  count,
  credited,
  entries,
}: {
  balance: number;
  count: number;
  credited: number;
  entries: WalletItem[];
}) {
  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">کیف پول</h1>
        <p className="mt-1 max-w-xl text-sm leading-7 text-navy/55">
          موجودی قابل استفاده در درخواست بعدی. اگر موردی لغو شود، مبلغ به همین‌جا برمی‌گردد.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.75fr)]">
        <section className="rounded-[1.25rem] bg-navy p-5 text-white shadow-sm sm:p-6 md:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/50">موجودی قابل استفاده</p>
              <p className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {formatTomanAmount(balance)}
              </p>
              <p className="mt-2 max-w-md text-sm leading-7 text-white/55">
                درگاه شارژ هنوز وصل نیست؛ برگشتی‌ها همین‌جا می‌نشینند.
              </p>
            </div>
            <button
              type="button"
              disabled
              title="درگاه شارژ هنوز فعال نیست"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 shrink-0 cursor-not-allowed bg-gold/70 px-5 text-navy-deep opacity-80",
              )}
            >
              <PlusIcon className="size-4" />
              شارژ کیف پول
            </button>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard icon={ReceiptIcon} label="تعداد تراکنش" value={toFaDigits(count)} hint="همه گردش‌ها" />
          <StatCard icon={ArrowDownLeftIcon} label="مجموع واریز" value={formatTomanAmount(credited)} hint="برگشت و شارژ" />
        </div>
      </div>

      <section className={cn(card, "overflow-hidden")}>
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-navy">
            <WalletIcon className="size-4 text-gold" />
            گردش حساب
          </h2>
          {count > entries.length ? (
            <p className="text-xs text-navy/45">آخرین {toFaDigits(entries.length)} مورد</p>
          ) : null}
        </div>

        {entries.length === 0 ? (
          <p className="px-5 pb-6 text-sm leading-7 text-navy/55">هنوز تراکنشی ثبت نشده است.</p>
        ) : (
          <ul>
            <li className="hidden border-y border-navy/10 px-5 py-2.5 text-[11px] text-navy/40 md:grid md:grid-cols-[9.5rem_minmax(0,1fr)_8.5rem_5.5rem] md:gap-4">
              <span>تاریخ</span>
              <span>شرح</span>
              <span>مبلغ</span>
              <span>وضعیت</span>
            </li>
            {entries.map((item) => (
              <li
                key={item.id}
                className="border-b border-navy/8 px-5 py-3.5 last:border-b-0 md:grid md:grid-cols-[9.5rem_minmax(0,1fr)_8.5rem_5.5rem] md:items-center md:gap-4"
              >
                <p className="text-xs text-navy/45 md:text-sm md:text-navy/55">
                  {formatFaDateTime(item.createdAt.toISOString())}
                </p>
                <div className="mt-1.5 min-w-0 md:mt-0">
                  <p className="truncate text-sm font-medium text-navy">{walletTitle(item)}</p>
                  <p className="mt-0.5 text-xs text-navy/45">{walletKind(item)}</p>
                </div>
                <p
                  className={cn(
                    "mt-2 text-sm font-medium md:mt-0",
                    item.amount >= 0 ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  {item.amount >= 0 ? "+" : "−"} {formatTomanAmount(item.amount)}
                </p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 md:mt-0">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  موفق
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof WalletIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className={cn(card, "flex items-start justify-between gap-3 p-4 sm:p-5")}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-navy/45">{label}</p>
        <p className="mt-2 truncate font-heading text-lg font-bold text-navy sm:text-xl">{value}</p>
        <p className="mt-1 text-xs text-navy/45">{hint}</p>
      </div>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-navy/15 text-gold">
        <Icon className="size-4" />
      </span>
    </div>
  );
}

function walletTitle(item: WalletItem) {
  const note = item.note?.trim();
  if (note) return note;
  if (item.reason === "refund") return "برگشت مبلغ درخواست";
  return "واریز به کیف پول";
}

function walletKind(item: WalletItem) {
  if (item.reason === "refund") return "برگشت";
  if (item.amount < 0) return "برداشت";
  return "واریز";
}
