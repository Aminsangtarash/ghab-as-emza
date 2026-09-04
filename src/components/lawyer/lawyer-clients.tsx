"use client";

import { useEffect, useState } from "react";

import {
  EmptyRow,
  ErrorNote,
  LawyerHeading,
  Tone,
  panelCard,
  panelFetch,
} from "@/components/lawyer/lawyer-ui";
import { SiteDataTable } from "@/components/ui/site-data-table";
import { formatFaDate, formatFaRelative, formatTomanAmount, toFaDigits } from "@/lib/format";
import type { LawyerClient } from "@/lib/lawyer-desk";
import { cn } from "@/lib/utils";

export function LawyerClients() {
  const [items, setItems] = useState<LawyerClient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      const result = await panelFetch<{ items: LawyerClient[] }>("/api/lawyer/clients");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems(result.data.items);
    })();
  }, []);

  const filtered = (items ?? []).filter((item) => {
    const needle = query.trim();
    if (!needle) return true;
    return item.fullName.includes(needle) || item.phone.includes(needle);
  });

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker="سابقه همکاری"
        title="موکلان"
        description="هر کسی که درخواست او را پذیرفته‌اید یا برای شما ثبت شده، همراه با تعداد درخواست‌ها، پرونده‌ها و مبالغ پرداختی."
      />

      <div className={cn(panelCard, "px-4 py-3")}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجوی نام یا شماره موبایل"
          className="h-11 w-full rounded-xl border border-navy/15 bg-white px-3 text-sm outline-none ring-gold/40 focus:ring-2"
        />
      </div>

      <ErrorNote>{error}</ErrorNote>

      {items === null ? (
        <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
      ) : (
        <div className={cn(panelCard, "overflow-hidden p-0")}>
          <SiteDataTable
            rows={filtered}
            rowKey={(item) => item.userId}
            pageSize={10}
            minWidthClassName="min-w-[44rem]"
            empty={
              <div className="p-6">
                <EmptyRow>موکلی پیدا نشد.</EmptyRow>
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
                id: "name",
                header: "نام",
                headerClassName: "text-right",
                className: "text-right",
                cell: (item) => (
                  <div className="min-w-0">
                    <p className="font-medium text-navy">{item.fullName}</p>
                    <p className="mt-0.5 text-[11px] text-navy/45">{toFaDigits(item.phone)}</p>
                  </div>
                ),
              },
              {
                id: "requests",
                header: "درخواست‌ها",
                hideOnMobile: true,
                className: "whitespace-nowrap text-center text-navy/60",
                cell: (item) => toFaDigits(item.requests),
              },
              {
                id: "cases",
                header: "پرونده‌ها",
                hideOnMobile: true,
                className: "whitespace-nowrap text-center text-navy/60",
                cell: (item) => toFaDigits(item.cases),
              },
              {
                id: "paid",
                header: "پرداختی",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => formatTomanAmount(item.paidToman),
              },
              {
                id: "activity",
                header: "آخرین فعالیت",
                className: "whitespace-nowrap text-center text-navy/50",
                cell: (item) => formatFaRelative(item.lastActivity),
              },
              {
                id: "open",
                header: "وضعیت",
                className: "text-center",
                cell: (item) =>
                  item.openRequests > 0 ? (
                    <Tone tone="bg-emerald-50 text-emerald-800">
                      {toFaDigits(item.openRequests)} فعال
                    </Tone>
                  ) : (
                    <span className="text-xs text-navy/40">شروع {formatFaDate(item.firstActivity)}</span>
                  ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
