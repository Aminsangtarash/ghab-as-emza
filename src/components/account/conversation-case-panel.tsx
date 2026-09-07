import Link from "next/link";
import { ChevronLeftIcon, FileTextIcon, MapPinIcon, ScaleIcon } from "lucide-react";

import { ConsultDocumentList } from "@/components/consult/document-list";
import { LawyerAvatar } from "@/components/lawyers/lawyer-avatar";
import { Stars } from "@/components/lawyers/stars";
import { panelLawyersHref } from "@/lib/account";
import type { ClientConversation } from "@/lib/conversations";
import { consultChannelMeta, consultationStatusMeta, type ConsultationStatus } from "@/lib/consult";
import type { Lawyer } from "@/lib/data";
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ConversationCasePanel({
  summary,
  lawyer,
}: {
  summary: ClientConversation;
  lawyer?: Lawyer | null;
}) {
  const closed = Boolean(summary.closedAt);
  const channel = consultChannelMeta[summary.channel];
  const profileHref = panelLawyersHref("/account", summary.lawyerSlug);

  return (
    <aside className="min-w-0 space-y-4 overflow-hidden">
      <div className="overflow-hidden rounded-[1.35rem] border border-navy/10 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-b from-navy to-navy-mid px-4 py-5 text-center text-white">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.22),transparent_70%)]"
            aria-hidden
          />
          <p className="relative text-[11px] font-semibold tracking-[0.16em] text-gold">اطلاعات وکیل</p>

          <div className="relative mx-auto mt-4 flex size-14 items-center justify-center">
            {lawyer?.image ? (
              <LawyerAvatar
                src={lawyer.image}
                name={lawyer.name}
                className="size-14 ring-2 ring-gold/45"
                size={112}
              />
            ) : (
              <span className="flex size-14 items-center justify-center rounded-full bg-gold/20 ring-2 ring-gold/35">
                <ScaleIcon className="size-6 text-gold" />
              </span>
            )}
          </div>

          <h2 className="relative mt-3 truncate font-heading text-base font-bold leading-7">
            {summary.lawyerName}
          </h2>
          <p className="relative mt-1 truncate text-xs text-white/65">
            {lawyer?.specialty ?? lawyer?.title ?? "وکیل پرونده شما"}
          </p>

          {lawyer ? (
            <div className="relative mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/70">
              <span className="inline-flex items-center gap-1">
                <Stars rating={lawyer.rating} />
                <span className="font-medium text-white">{toFaDigits(lawyer.rating.toFixed(1))}</span>
              </span>
              <span className="inline-flex max-w-full items-center gap-1">
                <MapPinIcon className="size-3.5 shrink-0" />
                <span className="truncate">{lawyer.city}</span>
              </span>
            </div>
          ) : null}

          <Link
            href={profileHref}
            className="relative mt-3 inline-flex items-center justify-center gap-1 text-xs font-medium text-gold hover:underline"
          >
            مشاهده پروفایل
            <ChevronLeftIcon className="size-3.5" />
          </Link>
        </div>

        <div className="min-w-0 overflow-hidden p-4">
          <p className="text-xs font-semibold tracking-wide text-gold-deep">جزئیات پرونده</p>
          <h3 className="mt-2 break-words font-heading text-sm font-semibold leading-7 text-navy">
            {summary.subject}
          </h3>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <dt className="shrink-0 text-navy/45">کد پیگیری</dt>
              <dd className="min-w-0 truncate text-end text-navy" dir="ltr">
                {toFaDigits(summary.trackingCode)}
              </dd>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <dt className="shrink-0 text-navy/45">وضعیت</dt>
              <dd className="min-w-0 text-end">
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
            <div className="flex min-w-0 items-start justify-between gap-3">
              <dt className="shrink-0 text-navy/45">نحوه ارتباط</dt>
              <dd className="min-w-0 truncate text-end text-navy/70">{channel.title}</dd>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <dt className="shrink-0 text-navy/45">شروع گفتگو</dt>
              <dd className="min-w-0 text-end text-xs leading-6 text-navy/70">
                {formatFaDateTime(summary.createdAt)}
              </dd>
            </div>
          </dl>

          <Link
            href={`/account/requests/${encodeURIComponent(summary.trackingCode)}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold-deep hover:underline"
          >
            مشاهده درخواست
            <ChevronLeftIcon className="size-4" />
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.35rem] border border-navy/10 bg-white p-4 shadow-sm">
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
