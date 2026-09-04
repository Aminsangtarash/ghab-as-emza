import Link from "next/link";
import { ChevronLeftIcon, FileTextIcon, ScaleIcon } from "lucide-react";

import { ConsultDocumentList } from "@/components/consult/document-list";
import type { ClientConversation } from "@/lib/conversations";
import { consultChannelMeta, consultationStatusMeta, type ConsultationStatus } from "@/lib/consult";
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ConversationCasePanel({ summary }: { summary: ClientConversation }) {
  const closed = Boolean(summary.closedAt);
  const channel = consultChannelMeta[summary.channel];

  return (
    <aside className="min-w-0 space-y-4">
      <div className="rounded-[1.35rem] border border-navy/10 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-gold-deep">جزئیات پرونده</p>
        <h2 className="mt-3 font-heading text-lg font-semibold text-navy leading-8">{summary.subject}</h2>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-navy/45">وکیل</dt>
            <dd className="flex items-center gap-1.5 text-end font-medium text-navy">
              <ScaleIcon className="size-3.5 shrink-0 text-gold-deep" />
              {summary.lawyerName}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-navy/45">کد پیگیری</dt>
            <dd className="text-end text-navy" dir="ltr">
              {toFaDigits(summary.trackingCode)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-navy/45">وضعیت</dt>
            <dd>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                  closed ? "bg-navy/5 text-navy/55" : "bg-emerald-50 text-emerald-800",
                )}
              >
                {closed
                  ? consultationStatusMeta.closed.title
                  : consultationStatusMeta[summary.status as ConsultationStatus]?.title ?? "فعال"}
              </span>
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-navy/45">نحوه ارتباط</dt>
            <dd className="text-end text-navy/70">{channel.title}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-navy/45">شروع گفتگو</dt>
            <dd className="text-end text-navy/70">{formatFaDateTime(summary.createdAt)}</dd>
          </div>
        </dl>

        <Link
          href={`/account/requests/${encodeURIComponent(summary.trackingCode)}`}
          className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-gold-deep hover:underline"
        >
          مشاهده درخواست
          <ChevronLeftIcon className="size-4" />
        </Link>
      </div>

      <div className="rounded-[1.35rem] border border-navy/10 bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gold-deep">
          <FileTextIcon className="size-3.5" />
          مدارک
        </p>
        {summary.documents.length > 0 ? (
          <ConsultDocumentList trackingCode={summary.trackingCode} items={summary.documents} />
        ) : (
          <p className="mt-3 text-sm leading-7 text-navy/55">هنوز مدرکی پیوست نشده است.</p>
        )}
        <p className="mt-3 text-xs leading-6 text-navy/45">
          اگر وکیل مدرک بخواهد، از داخل گفتگو ارسال می‌کنید؛ فایل‌های درخواست اولیه هم همین‌جا دیده می‌شوند.
        </p>
      </div>
    </aside>
  );
}
