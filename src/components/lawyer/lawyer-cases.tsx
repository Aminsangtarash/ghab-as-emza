"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  EmptyRow,
  ErrorNote,
  LawyerHeading,
  Tone,
  panelCard,
  panelFetch,
} from "@/components/lawyer/lawyer-ui";
import { buttonVariants } from "@/components/ui/button";
import { caseStageMeta, caseStatusMeta, type ClientCase } from "@/lib/case-model";
import { formatFaDate, formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "", label: "همه" },
  { id: "proposed", label: "در انتظار تأیید" },
  { id: "active", label: "جاری" },
  { id: "on-hold", label: "معلق" },
  { id: "closed", label: "بسته‌شده" },
  { id: "declined", label: "رد شده" },
] as const;

export function LawyerCases() {
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<ClientCase[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await panelFetch<{ items: ClientCase[] }>(
      `/api/lawyer/cases${status ? `?status=${status}` : ""}`,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setItems(result.data.items);
  }, [status]);

  useEffect(() => {
    setItems(null);
    void load();
  }, [load]);

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker="کارشناسی و پیگیری"
        title="پرونده‌ها"
        description="پرونده از داخل گفتگو پیشنهاد می‌شود؛ پس از تأیید موکل، مراحل، جلسه‌ها و مبالغ را همین‌جا ثبت و پیگیری کنید."
        actions={
          <Link
            href="/lawyer/chats"
            className={cn(buttonVariants({ variant: "outline" }), "h-11 border-navy/15 px-5 text-navy hover:bg-navy/5 hover:text-navy")}
          >
            تشکیل پرونده از گفتگو
          </Link>
        }
      />

      <div className={cn(panelCard, "flex flex-wrap gap-2 px-4 py-3")}>
        {tabs.map((tab) => (
          <button
            key={tab.id || "all"}
            type="button"
            onClick={() => setStatus(tab.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition",
              status === tab.id ? "bg-navy text-white" : "bg-paper text-navy/60 hover:bg-navy/5",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ErrorNote>{error}</ErrorNote>

      {items === null ? (
        <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div className={cn(panelCard, "px-6 py-10")}>
          <EmptyRow>پرونده‌ای در این دسته نیست.</EmptyRow>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/lawyer/cases/${item.id}`}
                className={cn(panelCard, "block px-5 py-4 transition hover:border-gold/40 hover:shadow-md")}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-navy">{item.title}</p>
                    <p className="mt-1 text-sm text-navy/55">
                      {caseStageMeta[item.stage]} · {item.clientName}
                    </p>
                  </div>
                  <Tone tone={caseStatusMeta[item.status].tone}>{caseStatusMeta[item.status].title}</Tone>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy/45">
                  <span>{toFaDigits(item.caseNumber)}</span>
                  <span>تشکیل: {formatFaDate(item.createdAt)}</span>
                  <span>حق‌الوکاله: {formatTomanAmount(item.feeToman)}</span>
                  {item.paidToman > 0 ? <span>دریافتی: {formatTomanAmount(item.paidToman)}</span> : null}
                  <span>{toFaDigits(item.eventCount)} رویداد</span>
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
