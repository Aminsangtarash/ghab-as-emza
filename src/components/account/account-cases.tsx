"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpenIcon, PlusIcon } from "lucide-react";

import { PanelHeading } from "@/components/panel/panel-heading";
import { buttonVariants } from "@/components/ui/button";
import { caseStageMeta, caseStatusMeta, type ClientCase } from "@/lib/case-model";
import { formatFaDate, formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AccountCases({ fromCode }: { fromCode?: string }) {
  const [items, setItems] = useState<ClientCase[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/account/cases", { credentials: "include" });
        const payload = (await response.json()) as { items?: ClientCase[]; error?: string };
        if (!response.ok) {
          setError(payload.error ?? "پرونده‌ها بارگذاری نشد.");
          return;
        }
        setItems(payload.items ?? []);
      } catch {
        setError("ارتباط با سرور برقرار نشد.");
      }
    })();
  }, []);

  const pendingCount = (items ?? []).filter((item) => item.status === "proposed").length;

  return (
    <div>
      <PanelHeading
        kicker="کارشناسی پرونده"
        title="پرونده‌ها"
        description="پرونده وقتی تشکیل می‌شود که وکیل پس از مشاوره، کارشناسی کامل‌تر پیشنهاد کند و شما آن را بپذیرید. هزینه پرونده جدا از مشاوره است و در دفتر تسویه می‌شود."
      />

      {pendingCount > 0 && (
        <p className="mt-6 rounded-2xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm leading-7 text-gold-deep">
          {toFaDigits(pendingCount)} پیشنهاد تشکیل پرونده در انتظار تأیید شماست.
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {items === null ? (
        <p className="mt-8 text-sm text-navy/55">در حال بارگذاری پرونده‌ها…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-[1.5rem] border border-gold/20 bg-white/80 px-5 py-12 text-center shadow-sm sm:px-8">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
            <FolderOpenIcon className="size-6" />
          </span>
          <p className="mt-5 font-heading text-lg font-semibold text-navy">هنوز پرونده‌ای تشکیل نشده</p>
          {fromCode ? (
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-navy/60">
              درخواست {toFaDigits(fromCode)} فعلاً پرونده جدا ندارد. اگر وکیل کارشناسی پرونده را پیشنهاد کند، همین‌جا دیده می‌شود.
            </p>
          ) : (
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-navy/60">
              تا زمانی که وکیل پیشنهاد پرونده بدهد و شما بپذیرید، این فهرست خالی می‌ماند.
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {fromCode ? (
              <Link
                href={`/account/requests/${encodeURIComponent(fromCode)}`}
                className={cn(buttonVariants({ variant: "outline" }), "h-11 border-navy/15 px-5")}
              >
                بازگشت به درخواست
              </Link>
            ) : null}
            <Link
              href="/account/requests"
              className={cn(buttonVariants({ variant: "outline" }), "h-11 border-navy/15 px-5")}
            >
              درخواست‌ها
            </Link>
            <Link
              href="/account/consult"
              className={cn(buttonVariants(), "h-11 bg-gold px-5 text-navy-deep hover:bg-gold-bright")}
            >
              <PlusIcon className="size-4" />
              ثبت مشاوره
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/account/cases/${item.id}`}
                className="block rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-navy/8 transition hover:ring-gold/35 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-navy">{item.title}</p>
                    <p className="mt-1 text-sm text-navy/60">
                      {caseStageMeta[item.stage]} · {item.lawyerName}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      caseStatusMeta[item.status].tone,
                    )}
                  >
                    {caseStatusMeta[item.status].title}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy/45">
                  <span>{toFaDigits(item.caseNumber)}</span>
                  <span>{formatFaDate(item.createdAt)}</span>
                  <span>حق‌الوکاله: {formatTomanAmount(item.feeToman)}</span>
                </div>
                {item.nextActionAt ? (
                  <p className="mt-2 rounded-xl bg-gold/10 px-3 py-2 text-xs text-gold-deep">
                    اقدام بعدی: {item.nextActionNote ?? "—"} · {formatFaDateTime(item.nextActionAt)}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
