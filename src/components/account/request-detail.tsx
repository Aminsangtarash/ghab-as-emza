import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  Clock3Icon,
  FolderOpenIcon,
  MessageCircleIcon,
  ScaleIcon,
  XCircleIcon,
} from "lucide-react";

import { ConsultDocumentList } from "@/components/consult/document-list";
import { RequestActions } from "@/components/account/request-actions";
import { StatusBadge } from "@/components/account/status-badge";
import { LawyerAvatar } from "@/components/lawyers/lawyer-avatar";
import {
  caseStageMeta,
  consultChannelMeta,
  consultationStatusMeta,
  paymentStatusMeta,
  timeSlotMeta,
  urgencyFeePercent,
  urgencyMeta,
  type ConsultationStatus,
  type TimeSlot,
} from "@/lib/consult";
import { getLawyer } from "@/lib/data";
import { formatFaDateTime, formatToman, toFaDigits } from "@/lib/format";
import type { ClientConsultation } from "@/lib/store-types";
import { cn } from "@/lib/utils";

export function RequestDetail({ item }: { item: ClientConsultation }) {
  const channel = consultChannelMeta[item.channel];
  const status = consultationStatusMeta[item.status];
  const lawyer = item.lawyerSlug ? getLawyer(item.lawyerSlug) : undefined;
  const approval = lawyerApproval(item);
  const conversationHref = item.conversationId
    ? `/account/chats/${item.conversationId}`
    : "/account/chats";
  const lawyerHref = item.lawyerSlug ? `/account/lawyers/${item.lawyerSlug}` : "/account/lawyers";
  const caseHref = `/account/cases?request=${encodeURIComponent(item.trackingCode)}`;

  return (
    <div>
      <Link href="/account/requests" className="text-sm font-medium text-gold-deep hover:underline">
        بازگشت به درخواست‌ها
      </Link>

      <section className="relative mt-5 rounded-[1.5rem] bg-white px-5 py-6 shadow-sm ring-1 ring-navy/8 sm:px-7 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gold-deep">
              {toFaDigits(item.trackingCode)}
            </p>
            <span className="mt-3 block h-1 w-12 rounded-full bg-gold" />
            <h1 className="mt-4 font-heading text-2xl font-bold text-navy sm:text-3xl">{item.subject}</h1>
            <p className="mt-2 text-sm text-navy/55">{formatFaDateTime(item.createdAt)}</p>
            <p className="mt-1 text-sm text-navy/50">
              {item.serviceTitle} · {channel.title}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>
        <RequestActions
          trackingCode={item.trackingCode}
          conversationId={item.conversationId}
          cancellable={item.status === "awaiting-operator" || item.status === "awaiting-lawyer"}
          deletable={item.status === "cancelled"}
          feeToman={item.paymentStatus === "stub-paid" ? item.feeToman : 0}
        />
      </section>

      <p className="mt-5 rounded-2xl border border-gold/20 bg-white/85 px-4 py-3 text-sm leading-7 text-navy/70 shadow-sm">
        {item.cancelReason ? `${status.hint} دلیل: ${item.cancelReason}` : status.hint}
        {item.refundedToman > 0 ? ` مبلغ ${formatToman(item.refundedToman)} به کیف پول برگشت.` : ""}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RelationCard
          href={conversationHref}
          icon={MessageCircleIcon}
          kicker="گفتگوی متصل"
          title={item.conversationId ? "گفتگو باز است" : "هنوز گفتگویی نیست"}
          detail={
            item.conversationId
              ? "ورود به همان گفتگوی این درخواست"
              : "پس از تأیید وکیل، گفتگو اینجا لینک می‌شود"
          }
          tone={item.conversationId ? "ready" : "wait"}
        />
        <RelationCard
          href={caseHref}
          icon={FolderOpenIcon}
          kicker="پرونده مربوط"
          title="هنوز تشکیل نشده"
          detail="پرونده فقط بعد از پیشنهاد وکیل، موافقت شما و پرداخت در محل ساخته می‌شود"
          tone="off"
        />
        <RelationCard
          href={lawyerHref}
          icon={ScaleIcon}
          kicker="وکیل مربوط"
          title={lawyer?.name ?? item.lawyerName ?? lawyerPendingTitle(item)}
          detail={
            lawyer
              ? `${lawyer.specialty} · مشاهده پروفایل`
              : item.lawyerPending
                ? "نام وکیل تا تأیید نمایش داده نمی‌شود"
                : "فهرست وکلا و متخصصان"
          }
          tone={lawyer ? "ready" : "wait"}
        >
          {lawyer ? (
            <LawyerAvatar src={lawyer.image} name={lawyer.name} className="size-10" size={80} />
          ) : null}
        </RelationCard>
        <RelationCard
          href={lawyerHref}
          icon={approval.icon}
          kicker="وضعیت تأیید وکیل"
          title={approval.title}
          detail={approval.detail}
          tone={approval.tone}
        />
      </div>

      <ol className="mt-8 grid gap-3 sm:grid-cols-4">
        {timeline(item.status).map((step) => (
          <li
            key={step.title}
            className={
              step.state === "current"
                ? "rounded-2xl bg-navy px-4 py-3 text-white shadow-sm ring-1 ring-gold/30"
                : "rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-navy/8"
            }
          >
            <p
              className={
                step.state === "current"
                  ? "text-[11px] font-medium text-gold"
                  : step.state === "done"
                    ? "text-[11px] font-medium text-gold-deep"
                    : "text-[11px] font-medium text-navy/45"
              }
            >
              {step.label}
            </p>
            <p className={`mt-1 text-sm font-medium ${step.state === "current" ? "text-white" : "text-navy"}`}>
              {step.title}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white/90 p-5 shadow-sm ring-1 ring-navy/8 sm:p-6">
            <span className="mb-3 block h-1 w-10 rounded-full bg-gold" />
            <h2 className="font-heading text-lg font-semibold text-navy">شرح موضوع</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-navy">{item.message}</p>
          </section>

          <section className="rounded-2xl bg-white/90 p-5 shadow-sm ring-1 ring-navy/8 sm:p-6">
            <span className="mb-3 block h-1 w-10 rounded-full bg-gold" />
            <h2 className="font-heading text-lg font-semibold text-navy">مدارک پیوست</h2>
            {(item.documents?.length ?? 0) > 0 ? (
              <div className="mt-4">
                <ConsultDocumentList trackingCode={item.trackingCode} items={item.documents} />
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-navy/60">
                {item.hasDocuments === "yes" ? "سند اعلام شده؛ فایلی پیوست نشده است." : "مدرکی پیوست نشده است."}
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-3">
          <Info label="خدمت" value={item.serviceTitle} />
          <Info label="نحوه مشاوره" value={`${channel.title} · ${channel.place}`} />
          <Info
            label="فوریت"
            value={
              urgencyFeePercent[item.urgency] > 0
                ? `${urgencyMeta[item.urgency].title} · +${toFaDigits(urgencyFeePercent[item.urgency])}٪ مبلغ`
                : urgencyMeta[item.urgency].title
            }
          />
          <Info label="وضعیت پرونده" value={caseStageMeta[item.caseStage]} />
          <Info
            label="پرداخت"
            value={
              item.discountCode
                ? `${formatToman(item.feeToman)} · کد ${item.discountCode} (${toFaDigits(item.discountPercent)}٪) · از ${formatToman(item.originalFeeToman)}`
                : `${formatToman(item.feeToman)} · ${paymentStatusMeta[item.paymentStatus]}`
            }
          />
          {item.city ? <Info label="شهر" value={item.city} /> : null}
          {item.preferredSlot ? (
            <Info label="بازه زمانی" value={timeSlotMeta[item.preferredSlot as TimeSlot] ?? item.preferredSlot} />
          ) : null}
          <Info label="تماس" value={`${item.fullName} · ${toFaDigits(item.phone)}`} />
        </aside>
      </div>
    </div>
  );
}

function RelationCard({
  href,
  icon: Icon,
  kicker,
  title,
  detail,
  tone,
  children,
}: {
  href: string;
  icon: LucideIcon;
  kicker: string;
  title: string;
  detail: string;
  tone: "ready" | "wait" | "off";
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col rounded-2xl p-4 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md",
        tone === "ready" && "bg-white ring-navy/8 hover:ring-gold/40",
        tone === "wait" && "bg-white/85 ring-navy/8 hover:ring-gold/25",
        tone === "off" && "bg-paper ring-navy/8 hover:ring-navy/15",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {children ?? (
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              tone === "ready" && "bg-navy text-gold",
              tone === "wait" && "bg-gold/15 text-gold-deep",
              tone === "off" && "bg-navy/6 text-navy/55",
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
        <ChevronLeftIcon className="size-4 text-navy/25 transition group-hover:text-gold-deep" />
      </div>
      <p className="mt-3 text-[11px] font-medium text-navy/45">{kicker}</p>
      <p className="mt-1 font-heading text-sm font-semibold text-navy">{title}</p>
      <p className="mt-1 text-xs leading-6 text-navy/55">{detail}</p>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-navy/8">
      <dt className="text-xs font-medium text-navy/50">{label}</dt>
      <dd className="mt-1 text-sm leading-7 text-navy">{value}</dd>
    </div>
  );
}

function lawyerPendingTitle(item: ClientConsultation) {
  if (item.lawyerMode === "assign") return "در انتظار معرفی";
  return "در انتظار تأیید";
}

function lawyerApproval(item: ClientConsultation) {
  if (item.status === "cancelled") {
    return {
      icon: XCircleIcon,
      tone: "off" as const,
      title: "تأیید نشده",
      detail: item.cancelReason ?? "درخواست لغو یا رد شده است.",
    };
  }
  if (item.lawyerAccepted) {
    return {
      icon: CheckCircle2Icon,
      tone: "ready" as const,
      title: "وکیل تأیید کرده",
      detail: item.lawyerName
        ? `${item.lawyerName} درخواست را پذیرفته است.`
        : "وکیل این درخواست را پذیرفته است.",
    };
  }
  if (item.status === "awaiting-operator") {
    return {
      icon: Clock3Icon,
      tone: "wait" as const,
      title: "هنوز معرفی نشده",
      detail: "اپراتور باید وکیل مناسب را مشخص کند.",
    };
  }
  return {
    icon: Clock3Icon,
    tone: "wait" as const,
    title: "در انتظار تأیید",
    detail: "وکیل هنوز پذیرش را اعلام نکرده است.",
  };
}

function timeline(status: ConsultationStatus) {
  if (status === "cancelled") {
    return [
      { label: "انجام شده", title: "ثبت درخواست", state: "done" as const },
      { label: "انجام شده", title: "پرداخت", state: "done" as const },
      { label: "فعلی", title: "لغو شده", state: "current" as const },
      { label: "بعدی", title: "انجام مشاوره", state: "next" as const },
    ];
  }
  const reviewDone = status === "in-progress" || status === "closed";
  const consultDone = status === "closed";
  const reviewCurrent = status === "awaiting-operator" || status === "awaiting-lawyer";

  return [
    { label: "انجام شده", title: "ثبت درخواست", state: "done" as const },
    { label: "انجام شده", title: "پرداخت", state: "done" as const },
    {
      label: reviewDone ? "انجام شده" : reviewCurrent ? "فعلی" : "بعدی",
      title: status === "awaiting-operator" ? "معرفی وکیل" : "تأیید وکیل",
      state: reviewDone ? ("done" as const) : reviewCurrent ? ("current" as const) : ("next" as const),
    },
    {
      label: consultDone ? "انجام شده" : reviewDone ? "فعلی" : "بعدی",
      title: "انجام مشاوره",
      state: consultDone ? ("done" as const) : reviewDone ? ("current" as const) : ("next" as const),
    },
  ];
}
