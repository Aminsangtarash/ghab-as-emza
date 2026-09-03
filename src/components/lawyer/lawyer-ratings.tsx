"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StarIcon } from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  LawyerHeading,
  StatTile,
  panelCard,
  panelFetch,
} from "@/components/lawyer/lawyer-ui";
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
      ) : items.length === 0 ? (
        <div className={cn(panelCard, "px-6 py-10")}>
          <EmptyRow>هنوز امتیازی ثبت نشده است.</EmptyRow>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className={cn(panelCard, "px-5 py-4")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-navy">{item.subject}</p>
                  <p className="mt-1 text-sm text-navy/55">{item.clientName}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-sm text-gold-deep">
                  <StarIcon className="size-3.5" />
                  {toFaDigits(item.score)} از ۵
                </span>
              </div>
              {item.comment ? (
                <p className="mt-3 rounded-2xl bg-paper/60 p-3 text-sm leading-7 text-navy/70">{item.comment}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-navy/40">
                <span>{toFaDigits(item.trackingCode)}</span>
                <span>{formatFaDate(item.createdAt)}</span>
                <Link href={`/lawyer/chats/${item.conversationId}`} className="text-navy/60 hover:text-navy">
                  مشاهده گفتگو
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
