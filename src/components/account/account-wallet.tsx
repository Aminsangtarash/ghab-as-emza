"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeftIcon, PlusIcon, ReceiptIcon, WalletIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { SiteDataTable } from "@/components/ui/site-data-table";
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

type PayoutItem = {
  id: string;
  amountToman: number;
  status: string;
  bankIban: string;
  createdAt: string;
  staffNote: string | null;
};

const payoutStatusLabel: Record<string, string> = {
  pending: "در انتظار تأیید مدیر",
  approved: "تأیید شده — در صف پایا (۲ تا ۳ روز کاری)",
  paid: "واریز شده",
  rejected: "رد شده",
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
  const router = useRouter();
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [amount, setAmount] = useState("");
  const [iban, setIban] = useState("");
  const [accountName, setAccountName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/wallet/payout", { credentials: "include" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        bankIban?: string | null;
        bankAccountName?: string | null;
        items: PayoutItem[];
      };
      setPayouts(data.items ?? []);
      if (data.bankIban) setIban(data.bankIban);
      if (data.bankAccountName) setAccountName(data.bankAccountName);
    })();
  }, []);

  async function requestPayout(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/wallet/payout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountToman: Number(amount.replace(/[^\d]/g, "")),
        bankIban: iban,
        bankAccountName: accountName,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "ثبت درخواست تسویه ممکن نشد.");
      return;
    }
    setMessage("درخواست تسویه ثبت شد. پس از تأیید مدیر، واریز پایا معمولاً ۲ تا ۳ روز کاری طول می‌کشد.");
    setAmount("");
    router.refresh();
    const refreshed = await fetch("/api/wallet/payout", { credentials: "include" });
    if (refreshed.ok) {
      const data = (await refreshed.json()) as { items: PayoutItem[] };
      setPayouts(data.items ?? []);
    }
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">کیف پول</h1>
        <p className="mt-1 max-w-xl text-sm leading-7 text-navy/55">
          موجودی پس از تأیید انصراف توسط مدیر اینجا می‌نشیند. برای برداشت به حساب بانکی، درخواست تسویه ثبت کنید.
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
                تسویه پس از تأیید مدیر، معمولاً طی ۲ تا ۳ روز کاری با پایا به شبا واریز می‌شود.
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
          <StatCard icon={ArrowDownLeftIcon} label="مجموع خالص" value={formatTomanAmount(credited)} hint="واریز منهای برداشت" />
        </div>
      </div>

      <section className={cn(card, "p-5")}>
        <h2 className="font-heading text-base font-semibold text-navy">درخواست تسویه حساب</h2>
        <p className="mt-1 text-xs leading-6 text-navy/50">
          مبلغ از موجودی کسر و تا تأیید/پرداخت مسدود می‌شود. حداقل ۵۰٬۰۰۰ تومان.
        </p>
        <form onSubmit={(e) => void requestPayout(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-navy/60">مبلغ (تومان)</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm"
              dir="ltr"
              placeholder="500000"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-navy/60">نام صاحب حساب</span>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm"
              required
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-navy/60">شماره شبا</span>
            <input
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm"
              dir="ltr"
              placeholder="IR..."
              required
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending || balance < 50_000}
              className={cn(buttonVariants(), "bg-navy text-gold disabled:opacity-60")}
            >
              {pending ? "در حال ثبت…" : "ثبت درخواست تسویه"}
            </button>
          </div>
        </form>
        {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}

        {payouts.length > 0 ? (
          <ul className="mt-5 divide-y divide-navy/8 border-t border-navy/10">
            {payouts.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-navy">{formatTomanAmount(item.amountToman)}</p>
                  <p className="mt-1 text-xs text-navy/45">{formatFaDateTime(item.createdAt)}</p>
                </div>
                <p className="text-xs text-navy/60">{payoutStatusLabel[item.status] ?? item.status}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

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
          <SiteDataTable
            rows={entries}
            rowKey={(item) => item.id}
            pageSize={10}
            minWidthClassName="min-w-[36rem]"
            columns={[
              {
                id: "date",
                header: "تاریخ",
                className: "whitespace-nowrap text-navy/55",
                cell: (item) => formatFaDateTime(item.createdAt.toISOString()),
              },
              {
                id: "desc",
                header: "شرح",
                headerClassName: "text-right",
                className: "min-w-0 text-right",
                cell: (item) => (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy">{walletTitle(item)}</p>
                    <p className="mt-0.5 text-xs text-navy/45">{walletKind(item)}</p>
                  </div>
                ),
              },
              {
                id: "amount",
                header: "مبلغ",
                className: "whitespace-nowrap",
                cell: (item) => (
                  <span className={cn("font-medium", item.amount >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {item.amount >= 0 ? "+" : "−"} {formatTomanAmount(Math.abs(item.amount))}
                  </span>
                ),
              },
              {
                id: "status",
                header: "وضعیت",
                className: "whitespace-nowrap",
                cell: () => (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-600" />
                    ثبت‌شده
                  </span>
                ),
              },
            ]}
          />
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
  if (item.reason === "payout-hold") return "مسدودسازی برای تسویه";
  if (item.reason === "payout-reject") return "برگشت پس از رد تسویه";
  return "واریز به کیف پول";
}

function walletKind(item: WalletItem) {
  if (item.reason === "refund") return "برگشت";
  if (item.reason.startsWith("payout")) return "تسویه";
  if (item.amount < 0) return "برداشت";
  return "واریز";
}
