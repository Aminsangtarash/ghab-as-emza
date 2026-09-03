"use client";

import { useEffect, useState } from "react";
import { PhoneIcon } from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  LawyerHeading,
  Tone,
  panelCard,
  panelFetch,
} from "@/components/lawyer/lawyer-ui";
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
      ) : filtered.length === 0 ? (
        <div className={cn(panelCard, "px-6 py-10")}>
          <EmptyRow>موکلی پیدا نشد.</EmptyRow>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((item) => (
            <li key={item.userId} className={cn(panelCard, "px-5 py-4")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-navy">{item.fullName}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-navy/55">
                    <PhoneIcon className="size-3.5 text-navy/35" />
                    {toFaDigits(item.phone)}
                  </p>
                </div>
                {item.openRequests > 0 ? (
                  <Tone tone="bg-emerald-50 text-emerald-800">
                    {toFaDigits(item.openRequests)} مورد فعال
                  </Tone>
                ) : null}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Cell label="درخواست‌ها" value={`${toFaDigits(item.requests)} مورد`} />
                <Cell label="پرونده‌ها" value={`${toFaDigits(item.cases)} مورد`} />
                <Cell label="پرداختی" value={formatTomanAmount(item.paidToman)} />
                <Cell label="آخرین فعالیت" value={formatFaRelative(item.lastActivity)} />
              </dl>
              <p className="mt-3 text-[11px] text-navy/40">
                شروع همکاری: {formatFaDate(item.firstActivity)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy/8 bg-paper/50 px-3 py-2">
      <dt className="text-[11px] text-navy/45">{label}</dt>
      <dd className="mt-0.5 text-sm text-navy/80">{value}</dd>
    </div>
  );
}
