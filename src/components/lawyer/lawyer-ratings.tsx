"use client";

import { useEffect, useState } from "react";
import { StarIcon } from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  LawyerHeading,
  StatTile,
  panelCard,
  panelFetch,
} from "@/components/lawyer/lawyer-ui";
import { SiteDataTable, SiteTableLink } from "@/components/ui/site-data-table";
import { formatFaDate, toFaDigits } from "@/lib/format";
import type { LawyerRating } from "@/lib/lawyer-desk";
import { cn } from "@/lib/utils";

export function LawyerRatings() {
  const [items, setItems] = useState<LawyerRating[] | null>(null);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const result = await panelFetch<{ items: LawyerRating[]; summary: { count: number; average: number } }>(
        "/api/lawyer/ratings",
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems(result.data.items);
      setSummary(result.data.summary);
    })();
  }, []);

  const breakdown = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: (items ?? []).filter((item) => item.score === score).length,
  }));

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker="بازخورد موکلان"
        title="امتیازها"
        description="امتیاز و نظر موکلان پس از بسته شدن هر گفتگو ثبت می‌شود."
      />

      <ErrorNote>{error}</ErrorNote>

      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <StatTile
          label="میانگین امتیاز"
          value={summary.count ? `${toFaDigits(summary.average)} از ۵` : "بدون امتیاز"}
          icon={StarIcon}
          tone="bg-gold/15 text-gold-deep"
        />
        <StatTile
          label="تعداد نظرها"
          value={`${toFaDigits(summary.count)} مورد`}
          icon={StarIcon}
          tone="bg-navy/8 text-navy"
        />
        <div className={cn(panelCard, "px-4 py-4")}>
          <p className="text-xs text-navy/45">توزیع امتیازها</p>
          <ul className="mt-3 space-y-1.5">
            {breakdown.map((row) => (
              <li key={row.score} className="flex items-center gap-2 text-xs text-navy/60">
                <span className="w-8 shrink-0">{toFaDigits(row.score)} ★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy/8">
                  <span
                    className="block h-full rounded-full bg-gold"
                    style={{ width: `${items?.length ? (row.count / items.length) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-end">{toFaDigits(row.count)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {items === null ? (
        <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
      ) : (
        <div className={cn(panelCard, "overflow-hidden p-0")}>
          <SiteDataTable
            rows={items}
            rowKey={(item) => item.id}
            pageSize={10}
            minWidthClassName="min-w-[44rem]"
            empty={
              <div className="p-6">
                <EmptyRow>هنوز امتیازی ثبت نشده است.</EmptyRow>
              </div>
            }
            columns={[
              {
                id: "subject",
                header: "موضوع",
                headerClassName: "text-right",
                className: "max-w-[14rem] text-right",
                cell: (item) => (
                  <div className="min-w-0">
                    <SiteTableLink href={`/lawyer/chats/${item.conversationId}`} className="block truncate">
                      {item.subject}
                    </SiteTableLink>
                    {item.comment ? (
                      <span className="mt-1 block truncate text-[11px] text-navy/45">{item.comment}</span>
                    ) : null}
                  </div>
                ),
              },
              {
                id: "client",
                header: "موکل",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => item.clientName,
              },
              {
                id: "score",
                header: "امتیاز",
                className: "text-center",
                cell: (item) => (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] text-gold-deep">
                    <StarIcon className="size-3" />
                    {toFaDigits(item.score)} از ۵
                  </span>
                ),
              },
              {
                id: "tracking",
                header: "کد",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => toFaDigits(item.trackingCode),
              },
              {
                id: "date",
                header: "تاریخ",
                className: "whitespace-nowrap text-center text-navy/50",
                cell: (item) => formatFaDate(item.createdAt),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
