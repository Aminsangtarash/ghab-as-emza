"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpenIcon, PlusIcon } from "lucide-react";

import { PanelHeading } from "@/components/panel/panel-heading";
import { buttonVariants } from "@/components/ui/button";
import { SiteDataTable, SiteTableLink } from "@/components/ui/site-data-table";
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
      ) : (
        <div className="mt-8 overflow-hidden rounded-[1.35rem] border border-navy/10 bg-white shadow-sm">
          <SiteDataTable
            rows={items}
            rowKey={(item) => item.id}
            pageSize={10}
            minWidthClassName="min-w-[48rem]"
            empty={
              <div className="px-5 py-12 text-center sm:px-8">
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
            }
            columns={[
              {
                id: "index",
                header: "ردیف",
                hideOnMobile: true,
                headerClassName: "px-3 md:px-3",
                className: "px-3 text-center text-navy/40 md:px-3",
                cell: (_row, index) => toFaDigits(index + 1),
              },
              {
                id: "title",
                header: "عنوان",
                headerClassName: "text-right",
                className: "max-w-[14rem] text-right",
                cell: (item) => (
                  <div className="min-w-0">
                    <SiteTableLink href={`/account/cases/${item.id}`} className="block truncate">
                      {item.title}
                    </SiteTableLink>
                    {item.nextActionAt ? (
                      <span className="mt-1 block truncate text-[11px] text-gold-deep">
                        اقدام: {item.nextActionNote ?? "—"} · {formatFaDateTime(item.nextActionAt)}
                      </span>
                    ) : null}
                  </div>
                ),
              },
              {
                id: "number",
                header: "شماره",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => toFaDigits(item.caseNumber),
              },
              {
                id: "stage",
                header: "مرحله",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => caseStageMeta[item.stage],
              },
              {
                id: "lawyer",
                header: "وکیل",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => item.lawyerName,
              },
              {
                id: "fee",
                header: "حق‌الوکاله",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => formatTomanAmount(item.feeToman),
              },
              {
                id: "date",
                header: "تاریخ",
                className: "whitespace-nowrap text-center text-navy/50",
                cell: (item) => formatFaDate(item.createdAt),
              },
              {
                id: "status",
                header: "وضعیت",
                className: "text-center",
                cell: (item) => (
                  <span
                    className={cn(
                      "inline-flex max-w-[9.5rem] truncate rounded-full px-2.5 py-1 text-[11px] font-medium md:max-w-none",
                      caseStatusMeta[item.status].tone,
                    )}
                  >
                    {caseStatusMeta[item.status].title}
                  </span>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
