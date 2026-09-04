"use client";

import Link from "next/link";
import { PlusIcon, ScaleIcon } from "lucide-react";

import { RequestActions } from "@/components/account/request-actions";
import { buttonVariants } from "@/components/ui/button";
import { SiteDataTable, SiteTableLink } from "@/components/ui/site-data-table";
import { consultChannelMeta, consultationStatusMeta, type ConsultationStatus } from "@/lib/consult";
import { formatFaDateTime, formatToman, toFaDigits } from "@/lib/format";
import type { ClientConsultation } from "@/lib/store-types";
import { cn } from "@/lib/utils";

const statusTone: Record<ConsultationStatus, string> = {
  "awaiting-operator": "bg-sky-50 text-sky-800",
  "awaiting-lawyer": "bg-amber-50 text-amber-800",
  "in-progress": "bg-emerald-50 text-emerald-800",
  closed: "bg-navy/5 text-navy/55",
  cancelled: "bg-red-50 text-red-700",
};

export function RequestsList({ items }: { items: ClientConsultation[] }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gold-deep">پیگیری</p>
          <span className="mt-3 block h-1 w-12 rounded-full bg-gold" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-navy">درخواست‌ها</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-navy/65">
            هر درخواست پس از ثبت، خودکار اینجا می‌آید. پس از تأیید وکیل، از جزئیات درخواست یا از منوی گفتگوها وارد همان گفتگو شوید.
          </p>
        </div>
        <Link
          href="/account/consult"
          className={cn(buttonVariants({ size: "lg" }), "h-11 bg-gold px-5 text-navy-deep hover:bg-gold-bright")}
        >
          <PlusIcon className="size-4" />
          درخواست جدید
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-[1.35rem] border border-navy/10 bg-white shadow-sm">
        <SiteDataTable
          rows={items}
          rowKey={(item) => item.id}
          pageSize={10}
          minWidthClassName="min-w-[52rem]"
          empty={
            <div className="px-5 py-12 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
                <ScaleIcon className="size-5" />
              </span>
              <p className="mt-4 font-heading font-semibold text-navy">لیست خالی است</p>
              <p className="mt-2 text-sm leading-7 text-navy/60">
                اولین مشاوره را ثبت کنید تا در این فهرست دیده شود.
              </p>
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
              id: "subject",
              header: "عنوان",
              headerClassName: "text-right",
              className: "max-w-[14rem] text-right",
              cell: (item) => (
                <div className="min-w-0">
                  <SiteTableLink
                    href={`/account/requests/${item.trackingCode}`}
                    className="block truncate"
                  >
                    {item.subject}
                  </SiteTableLink>
                  {item.conversationId ? (
                    <span className="mt-1 block text-[11px] text-gold-deep">گفتگو باز است</span>
                  ) : null}
                </div>
              ),
            },
            {
              id: "tracking",
              header: "کد پیگیری",
              hideOnMobile: true,
              className: "whitespace-nowrap text-navy/60",
              cell: (item) => toFaDigits(item.trackingCode),
            },
            {
              id: "service",
              header: "خدمت",
              hideOnMobile: true,
              className: "whitespace-nowrap text-navy/60",
              cell: (item) => item.serviceTitle,
            },
            {
              id: "channel",
              header: "کانال",
              hideOnMobile: true,
              className: "whitespace-nowrap text-navy/60",
              cell: (item) => consultChannelMeta[item.channel].title,
            },
            {
              id: "lawyer",
              header: "وکیل",
              hideOnMobile: true,
              className: "whitespace-nowrap text-navy/60",
              cell: (item) =>
                item.lawyerPending ? "در انتظار تأیید" : item.lawyerName ?? "—",
            },
            {
              id: "fee",
              header: "مبلغ",
              hideOnMobile: true,
              className: "whitespace-nowrap text-navy/60",
              cell: (item) => formatToman(item.feeToman),
            },
            {
              id: "date",
              header: "تاریخ و ساعت",
              className: "whitespace-nowrap text-center text-navy/50",
              cell: (item) => formatFaDateTime(item.createdAt),
            },
            {
              id: "status",
              header: "وضعیت",
              className: "text-center",
              cell: (item) => (
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex max-w-[9.5rem] truncate rounded-full px-2.5 py-1 text-[11px] font-medium md:max-w-none",
                      statusTone[item.status],
                    )}
                  >
                    {consultationStatusMeta[item.status].title}
                  </span>
                  {item.status === "cancelled" ? (
                    <RequestActions
                      trackingCode={item.trackingCode}
                      cancellable={false}
                      deletable
                      feeToman={0}
                      compact
                    />
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
