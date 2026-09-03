"use client";

import { useEffect, useState } from "react";
import { FolderOpenIcon, ReceiptTextIcon, WalletIcon } from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  LawyerHeading,
  SectionCard,
  StatTile,
  Tone,
  panelCard,
  panelFetch,
} from "@/components/lawyer/lawyer-ui";
import { consultationStatusMeta, type ConsultationStatus } from "@/lib/consult";
import { formatFaDate, formatToman, formatTomanAmount, toFaDigits } from "@/lib/format";
import type { EarningRow } from "@/lib/lawyer-desk";
import { cn } from "@/lib/utils";

type Payload = {
  items: EarningRow[];
  total: number;
  month: number;
  paidCount: number;
  caseFeeTotal: number;
  caseFeePaid: number;
};

export function LawyerEarnings() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const result = await panelFetch<Payload>("/api/lawyer/earnings");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setData(result.data);
    })();
  }, []);

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker="گزارش مالی"
        title="درآمد"
        description="مبلغ مشاوره‌های پذیرفته‌شده و حق‌الوکاله پرونده‌ها. تسویه با دفتر خارج از سامانه انجام می‌شود."
      />

      <ErrorNote>{error}</ErrorNote>

      {!data ? (
        <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
      ) : (
        <>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="مشاوره این ماه"
              value={formatTomanAmount(data.month)}
              icon={WalletIcon}
              tone="bg-gold/15 text-gold-deep"
            />
            <StatTile
              label="مجموع مشاوره‌ها"
              value={formatTomanAmount(data.total)}
              hint={`${toFaDigits(data.paidCount)} مورد پرداخت‌شده`}
              icon={ReceiptTextIcon}
              tone="bg-navy/8 text-navy"
            />
            <StatTile
              label="حق‌الوکاله پرونده‌ها"
              value={formatTomanAmount(data.caseFeeTotal)}
              hint="مبلغ توافقی ثبت‌شده"
              icon={FolderOpenIcon}
              tone="bg-sky-50 text-sky-800"
            />
            <StatTile
              label="دریافتی پرونده‌ها"
              value={formatTomanAmount(data.caseFeePaid)}
              hint="مبلغی که وصول شده"
              icon={WalletIcon}
              tone="bg-emerald-50 text-emerald-800"
            />
          </div>

          <SectionCard title="ریز مشاوره‌ها" hint="۱۰۰ مورد آخر">
            {data.items.length === 0 ? (
              <EmptyRow>موردی ثبت نشده است.</EmptyRow>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr className="text-start text-xs text-navy/45">
                      <th className="pb-2 text-start font-medium">موضوع</th>
                      <th className="pb-2 text-start font-medium">موکل</th>
                      <th className="pb-2 text-start font-medium">خدمت</th>
                      <th className="pb-2 text-start font-medium">مبلغ</th>
                      <th className="pb-2 text-start font-medium">وضعیت</th>
                      <th className="pb-2 text-start font-medium">تاریخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.trackingCode} className="border-t border-navy/8">
                        <td className="py-3 pe-3">
                          <p className="font-medium text-navy">{item.subject}</p>
                          <p className="mt-0.5 text-[11px] text-navy/40">{toFaDigits(item.trackingCode)}</p>
                        </td>
                        <td className="py-3 pe-3 text-navy/70">{item.clientName}</td>
                        <td className="py-3 pe-3 text-navy/70">{item.service}</td>
                        <td className="py-3 pe-3 text-navy/80">{formatToman(item.feeToman)}</td>
                        <td className="py-3 pe-3">
                          <Tone tone={item.status === "closed" ? "bg-navy/5 text-navy/55" : "bg-emerald-50 text-emerald-800"}>
                            {consultationStatusMeta[item.status as ConsultationStatus]?.title ?? item.status}
                          </Tone>
                        </td>
                        <td className="py-3 text-xs text-navy/50">{formatFaDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
