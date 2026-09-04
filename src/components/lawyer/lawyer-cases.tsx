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
import { SiteDataTable, SiteTableLink } from "@/components/ui/site-data-table";
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
      ) : (
        <div className={cn(panelCard, "overflow-hidden p-0")}>
          <SiteDataTable
            rows={items}
            rowKey={(item) => item.id}
            pageSize={10}
            minWidthClassName="min-w-[52rem]"
            empty={
              <div className="p-6">
                <EmptyRow>پرونده‌ای در این دسته نیست.</EmptyRow>
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
                    <SiteTableLink href={`/lawyer/cases/${item.id}`} className="block truncate">
                      {item.title}
                    </SiteTableLink>
                    {item.nextActionAt ? (
                      <span className="mt-1 block truncate text-[11px] text-gold-deep">
                        {item.nextActionNote ?? "اقدام بعدی"} · {formatFaDateTime(item.nextActionAt)}
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
                id: "client",
                header: "موکل",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => item.clientName,
              },
              {
                id: "stage",
                header: "مرحله",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => caseStageMeta[item.stage],
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
                cell: (item) => <Tone tone={caseStatusMeta[item.status].tone}>{caseStatusMeta[item.status].title}</Tone>,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
