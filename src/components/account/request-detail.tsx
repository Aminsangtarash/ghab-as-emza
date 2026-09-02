import Link from "next/link";

import { StatusBadge } from "@/components/account/status-badge";
import {
  caseStageMeta,
  consultChannelMeta,
  consultationStatusMeta,
  paymentStatusMeta,
  timeSlotMeta,
  urgencyMeta,
  type ConsultationStatus,
  type TimeSlot,
} from "@/lib/consult";
import { formatFaDateTime, formatToman, toFaDigits } from "@/lib/format";
import type { ClientConsultation } from "@/lib/store";

export function RequestDetail({ item }: { item: ClientConsultation }) {
  const channel = consultChannelMeta[item.channel];
  const status = consultationStatusMeta[item.status];

  return (
    <div>
      <Link href="/account/requests" className="text-sm text-gold-deep hover:underline">
        بازگشت به درخواست‌ها
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gold-deep" dir="ltr">
            {toFaDigits(item.trackingCode)}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-navy">{item.subject}</h1>
          <p className="mt-2 text-sm text-navy/60">{formatFaDateTime(item.createdAt)}</p>
        </div>
        <StatusBadge status={item.status} className="text-xs" />
      </div>

      <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm leading-7 text-navy/70">{status.hint}</p>

      <ol className="mt-8 grid gap-3 sm:grid-cols-4">
        {timeline(item.status).map((step) => (
          <li
            key={step.title}
            className="rounded-2xl bg-paper px-4 py-3 ring-1 ring-navy/8"
          >
            <p className="text-[11px] font-medium text-navy/45">{step.label}</p>
            <p className="mt-1 text-sm font-medium text-navy">{step.title}</p>
          </li>
        ))}
      </ol>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2">
        <Info label="خدمت" value={item.serviceTitle} />
        <Info label="نحوه مشاوره" value={`${channel.title} · ${channel.place}`} />
        <Info
          label="وکیل"
          value={
            item.lawyerPending
              ? item.lawyerMode === "assign"
                ? "معرفی توسط اپراتور — هنوز اعلام نشده"
                : "در انتظار تأیید وکیل — نام نمایش داده نمی‌شود"
              : (item.lawyerName ?? "—")
          }
        />
        <Info label="فوریت" value={urgencyMeta[item.urgency].title} />
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
        <Info label="مدارک" value={item.hasDocuments === "yes" ? "سند یا قرارداد موجود است" : "هنوز مدرکی اعلام نشده"} />
        {item.preferredSlot ? (
          <Info label="بازه زمانی" value={timeSlotMeta[item.preferredSlot as TimeSlot] ?? item.preferredSlot} />
        ) : null}
        <Info label="تماس" value={`${item.fullName} · ${toFaDigits(item.phone)}`} />
      </dl>

      <div className="mt-6 rounded-2xl bg-paper p-5">
        <p className="text-xs font-medium text-navy/50">شرح موضوع</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-8 text-navy">{item.message}</p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper px-4 py-3">
      <dt className="text-xs font-medium text-navy/50">{label}</dt>
      <dd className="mt-1 text-sm leading-7 text-navy">{value}</dd>
    </div>
  );
}

function timeline(status: ConsultationStatus) {
  const reviewDone = status === "in-progress" || status === "closed";
  const consultDone = status === "closed";
  const reviewCurrent = status === "awaiting-operator" || status === "awaiting-lawyer";

  return [
    { label: "انجام شده", title: "ثبت درخواست" },
    { label: "انجام شده", title: "پرداخت" },
    {
      label: reviewDone ? "انجام شده" : reviewCurrent ? "فعلی" : "بعدی",
      title: status === "awaiting-operator" ? "معرفی وکیل" : "تأیید وکیل",
    },
    {
      label: consultDone ? "انجام شده" : reviewDone ? "فعلی" : "بعدی",
      title: "انجام مشاوره",
    },
  ];
}
