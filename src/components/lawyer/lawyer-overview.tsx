"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClockIcon,
  ClipboardListIcon,
  FolderOpenIcon,
  InboxIcon,
  MessageCircleIcon,
  StarIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

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
import { buttonVariants } from "@/components/ui/button";
import { appointmentKindMeta, type ClientAppointment } from "@/lib/appointment-model";
import { panelGreeting } from "@/lib/account";
import { caseStatusMeta, type ClientCase } from "@/lib/case-model";
import { consultChannelMeta, urgencyMeta } from "@/lib/consult";
import type { LawyerQueueItem } from "@/lib/conversations";
import type { LawyerRating, LawyerStats, ReplyNeeded } from "@/lib/lawyer-desk";
import { formatFaDateTime, formatFaLongDate, formatFaRelative, formatTomanAmount, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type Overview = {
  stats: LawyerStats;
  queue: LawyerQueueItem[];
  needsReply: ReplyNeeded[];
  appointments: ClientAppointment[];
  caseActions: ClientCase[];
  ratings: LawyerRating[];
  acceptingNew: boolean;
};

export function LawyerOverview({ lawyerName }: { lawyerName: string }) {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await panelFetch<Overview>("/api/lawyer/overview");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setData(result.data);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function decide(action: "accept" | "reject", trackingCode: string) {
    setPending(trackingCode);
    const result = await panelFetch<{ conversationId?: string }>("/api/lawyer/queue", {
      method: "POST",
      body: JSON.stringify({ action, trackingCode }),
    });
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (action === "accept" && result.data.conversationId) {
      router.push(`/lawyer/chats/${result.data.conversationId}`);
      return;
    }
    await load();
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>
          {error ?? "در حال بارگذاری میز کار…"}
        </div>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker="میز کار وکیل"
        title={`${panelGreeting()}، ${lawyerName}`}
        description={`${formatFaLongDate()} — کارهای امروز شما در یک نگاه.`}
        actions={
          <>
            <Link
              href="/lawyer/requests"
              className={cn(buttonVariants(), "h-11 bg-navy px-5 text-white hover:bg-navy-mid")}
            >
              <ClipboardListIcon className="size-4" />
              درخواست‌های جدید
            </Link>
            <Link
              href="/lawyer/chats?filter=needs-reply"
              className={cn(buttonVariants({ variant: "outline" }), "h-11 border-navy/15 px-5 text-navy hover:bg-navy/5 hover:text-navy")}
            >
              <MessageCircleIcon className="size-4" />
              منتظر پاسخ
            </Link>
          </>
        }
      />

      {!data.acceptingNew && (
        <p className="rounded-[1.35rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900">
          پذیرش درخواست جدید در پروفایل شما خاموش است؛ درخواست‌های تازه به شما پیشنهاد نمی‌شود.{" "}
          <Link href="/lawyer/profile" className="font-medium underline">
            تغییر در پروفایل
          </Link>
        </p>
      )}

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          href="/lawyer/requests"
          label="در انتظار پذیرش"
          value={`${toFaDigits(stats.queue)} درخواست`}
          hint="صف درخواست‌های شما"
          icon={InboxIcon}
          tone="bg-gold/15 text-gold-deep"
        />
        <StatTile
          href="/lawyer/chats?filter=needs-reply"
          label="منتظر پاسخ شما"
          value={`${toFaDigits(stats.awaitingReply)} گفتگو`}
          hint={`${toFaDigits(stats.activeChats)} گفتگوی فعال`}
          icon={MessageCircleIcon}
          tone="bg-emerald-50 text-emerald-800"
        />
        <StatTile
          href="/lawyer/cases"
          label="پرونده‌های باز"
          value={`${toFaDigits(stats.cases.open)} پرونده`}
          hint={`${toFaDigits(stats.cases.proposed)} در انتظار تأیید موکل`}
          icon={FolderOpenIcon}
          tone="bg-sky-50 text-sky-800"
        />
        <StatTile
          href="/lawyer/schedule"
          label="نوبت‌های امروز"
          value={`${toFaDigits(stats.appointments.today)} جلسه`}
          hint={`${toFaDigits(stats.appointments.upcoming)} نوبت پیش‌رو`}
          icon={CalendarClockIcon}
          tone="bg-navy/8 text-navy"
        />
        <StatTile
          href="/lawyer/earnings"
          label="درآمد این ماه"
          value={formatTomanAmount(stats.earnings.month)}
          hint={`مجموع: ${formatTomanAmount(stats.earnings.total)}`}
          icon={WalletIcon}
          tone="bg-gold/15 text-gold-deep"
        />
        <StatTile
          href="/lawyer/ratings"
          label="میانگین امتیاز"
          value={stats.ratings.count ? `${toFaDigits(stats.ratings.average)} از ۵` : "بدون امتیاز"}
          hint={`${toFaDigits(stats.ratings.count)} نظر ثبت‌شده`}
          icon={StarIcon}
          tone="bg-amber-50 text-amber-800"
        />
        <StatTile
          href="/lawyer/clients"
          label="موکلان"
          value={`${toFaDigits(stats.clients)} نفر`}
          hint="سابقه کامل هر موکل"
          icon={UsersIcon}
          tone="bg-navy/8 text-navy"
        />
        <StatTile
          href="/lawyer/chats?filter=closed"
          label="گفتگوهای بسته‌شده"
          value={`${toFaDigits(stats.closedChats)} مورد`}
          hint="آرشیو مشاوره‌ها"
          icon={ClipboardListIcon}
          tone="bg-navy/8 text-navy/70"
        />
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <SectionCard
          title="درخواست‌های در انتظار"
          hint="پذیرش، گفتگو را باز می‌کند. رد کردن، مبلغ را به کیف پول موکل برمی‌گرداند."
          action={
            <Link href="/lawyer/requests" className="text-xs text-navy/50 hover:text-navy">
              همه
            </Link>
          }
        >
          {data.queue.length === 0 ? (
            <EmptyRow>درخواستی در صف شما نیست.</EmptyRow>
          ) : (
            <ul className="space-y-3">
              {data.queue.map((item) => (
                <li key={item.trackingCode} className="rounded-2xl border border-navy/8 bg-paper/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold text-navy">{item.subject}</p>
                      <p className="mt-1 text-xs text-navy/55">
                        {item.serviceTitle} · {consultChannelMeta[item.channel].title} · {item.clientName}
                      </p>
                      <p className="mt-1 text-[11px] text-navy/40">
                        {toFaDigits(item.trackingCode)} · {formatFaRelative(item.createdAt)}
                      </p>
                    </div>
                    <Tone tone={item.urgency === "urgent" ? "bg-red-50 text-red-700" : "bg-navy/5 text-navy/55"}>
                      {urgencyMeta[item.urgency as "normal" | "soon" | "urgent"]?.title ?? "عادی"}
                    </Tone>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending === item.trackingCode}
                      onClick={() => void decide("accept", item.trackingCode)}
                      className={cn(buttonVariants(), "h-9 bg-navy px-4 text-white hover:bg-navy-mid")}
                    >
                      پذیرش
                    </button>
                    <button
                      type="button"
                      disabled={pending === item.trackingCode}
                      onClick={() => void decide("reject", item.trackingCode)}
                      className={cn(buttonVariants({ variant: "outline" }), "h-9 border-navy/15 px-4")}
                    >
                      رد
                    </button>
                    <Link
                      href="/lawyer/requests"
                      className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-navy/60")}
                    >
                      جزئیات
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="منتظر پاسخ شما"
          hint="گفتگوهایی که آخرین پیام از موکل است."
          action={
            <Link href="/lawyer/chats?filter=needs-reply" className="text-xs text-navy/50 hover:text-navy">
              همه
            </Link>
          }
        >
          {data.needsReply.length === 0 ? (
            <EmptyRow>همه پیام‌ها پاسخ داده شده است.</EmptyRow>
          ) : (
            <ul className="divide-y divide-navy/8">
              {data.needsReply.map((item) => (
                <li key={item.conversationId}>
                  <Link href={`/lawyer/chats/${item.conversationId}`} className="block py-3 transition hover:opacity-80">
                    <p className="font-heading text-sm font-semibold text-navy">{item.subject}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-6 text-navy/55">{item.lastMessage}</p>
                    <p className="mt-1 text-[11px] text-navy/40">
                      {item.clientName} · {formatFaRelative(item.lastAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="نوبت‌های پیش‌رو"
          hint="جلسه‌های تلفنی، تصویری و حضوری."
          action={
            <Link href="/lawyer/schedule" className="text-xs text-navy/50 hover:text-navy">
              تقویم
            </Link>
          }
        >
          {data.appointments.length === 0 ? (
            <EmptyRow>نوبتی ثبت نشده است.</EmptyRow>
          ) : (
            <ul className="space-y-3">
              {data.appointments.map((item) => (
                <li key={item.id} className="rounded-2xl border border-navy/8 bg-paper/50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-navy">
                      {appointmentKindMeta[item.kind]} — {item.clientName}
                    </p>
                    <Tone tone="bg-navy/5 text-navy/60">{toFaDigits(item.minutes)} دقیقه</Tone>
                  </div>
                  <p className="mt-1 text-xs text-navy/50">{formatFaDateTime(item.scheduledAt)}</p>
                  {item.note ? <p className="mt-1 text-xs text-navy/45">{item.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="اقدام‌های نزدیک پرونده"
          hint="جلسه یا مهلت ثبت‌شده روی پرونده‌های جاری."
          action={
            <Link href="/lawyer/cases" className="text-xs text-navy/50 hover:text-navy">
              پرونده‌ها
            </Link>
          }
        >
          {data.caseActions.length === 0 ? (
            <EmptyRow>اقدام زمان‌داری روی پرونده‌ها ثبت نشده است.</EmptyRow>
          ) : (
            <ul className="space-y-3">
              {data.caseActions.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/lawyer/cases/${item.id}`}
                    className="block rounded-2xl border border-navy/8 bg-paper/50 px-4 py-3 transition hover:border-gold/35"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-navy">{item.title}</p>
                      <Tone tone={caseStatusMeta[item.status].tone}>{caseStatusMeta[item.status].title}</Tone>
                    </div>
                    <p className="mt-1 text-xs text-navy/50">
                      {item.nextActionNote ?? "اقدام بعدی"} ·{" "}
                      {item.nextActionAt ? formatFaDateTime(item.nextActionAt) : "بدون زمان"}
                    </p>
                    <p className="mt-1 text-[11px] text-navy/40">
                      {toFaDigits(item.caseNumber)} · {item.clientName}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="آخرین بازخورد موکلان"
        action={
          <Link href="/lawyer/ratings" className="text-xs text-navy/50 hover:text-navy">
            همه امتیازها
          </Link>
        }
      >
        {data.ratings.length === 0 ? (
          <EmptyRow>هنوز امتیازی ثبت نشده است.</EmptyRow>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.ratings.map((item) => (
              <li key={item.id} className="rounded-2xl border border-navy/8 bg-paper/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-navy">{item.clientName}</p>
                  <span className="flex items-center gap-1 text-sm text-gold-deep">
                    <StarIcon className="size-3.5" />
                    {toFaDigits(item.score)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-navy/50">{item.subject}</p>
                {item.comment ? (
                  <p className="mt-2 text-xs leading-6 text-navy/60">{item.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
