import Link from "next/link";
import Image from "next/image";
import {
  BellIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ClipboardListIcon,
  FilePenIcon,
  FolderOpenIcon,
  HeadsetIcon,
  MessageCircleIcon,
  PlusIcon,
  ScaleIcon,
  SunIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { panelGreeting } from "@/lib/account";
import { consultationStatusMeta, type ConsultationStatus } from "@/lib/consult";
import { formatFaDate, formatFaLongDate, formatFaRelative, formatTomanAmount, toFaDigits } from "@/lib/format";
import type { ClientConsultation, PublicUser } from "@/lib/store";
import { cn } from "@/lib/utils";

const tableStatusTone: Record<ConsultationStatus, string> = {
  "awaiting-operator": "bg-sky-50 text-sky-800",
  "awaiting-lawyer": "bg-amber-50 text-amber-800",
  "in-progress": "bg-emerald-50 text-emerald-800",
  closed: "bg-navy/5 text-navy/55",
  cancelled: "bg-red-50 text-red-700",
};

const card = "rounded-[1.35rem] border border-navy/10 bg-white text-navy shadow-sm";

const quickServices = [
  {
    href: "/account/consult?service=consultation",
    title: "مشاوره آنلاین",
    hint: "سؤال حقوقی را ثبت کنید",
    icon: HeadsetIcon,
    tone: "bg-gold/15 text-gold-deep",
  },
  {
    href: "/account/consult?service=documents",
    title: "بررسی قرارداد",
    hint: "متن را قبل از امضا بفرستید",
    icon: FilePenIcon,
    tone: "bg-navy/8 text-navy",
  },
  {
    href: "/account/cases",
    title: "پرونده‌ها",
    hint: "کارشناسی پس از پیشنهاد وکیل",
    icon: FolderOpenIcon,
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    href: "/account/lawyers",
    title: "وکلا و متخصصان",
    hint: "پروفایل و ثبت مشاوره",
    icon: ScaleIcon,
    tone: "bg-sky-50 text-sky-800",
  },
] as const;

export function AccountOverview({
  user,
  items,
}: {
  user: PublicUser;
  items: ClientConsultation[];
}) {
  const pending = items.filter((item) => item.status !== "closed" && item.status !== "cancelled");
  const cancelled = items.filter((item) => item.status === "cancelled");
  const greeting = panelGreeting();
  const rows = items.slice(0, 6);
  const notices = items.slice(0, 5);
  const cancelledNotice = cancelled[0];

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <section className={cn(card, "relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6 md:px-7 md:py-7")}>
        {/* <SunIcon className="absolute start-5 top-5 size-5 text-gold sm:start-6 sm:top-6" /> */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="min-w-0 flex-1 pt-6 md:pt-2">
            <h1 className="font-heading text-2xl font-bold text-navy md:text-[1.75rem] lg:text-3xl">
              {greeting}، {user.fullName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-navy/60">خوشحالیم که دوباره شما را می‌بینیم.</p>
            <p className="mt-1 text-xs text-navy/40">{formatFaLongDate()}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/account/consult"
                className={cn(buttonVariants({ size: "lg" }), "h-11 flex-1 bg-gold px-5 text-navy-deep hover:bg-gold sm:flex-none")}
              >
                <PlusIcon className="size-4" />
                ثبت درخواست
              </Link>
              <Link
                href="/account/chats"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 flex-1 border-navy/15 bg-transparent px-5 text-navy hover:bg-navy/5 hover:text-navy sm:flex-none",
                )}
              >
                <MessageCircleIcon className="size-4" />
                گفتگوها
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[16rem] shrink-0 sm:max-w-[18rem] md:mx-0 md:w-[15.5rem] lg:w-[17.5rem]">
            <Image
              src="/images/dashboard-welcome.jpg"
              alt=""
              width={560}
              height={420}
              className="h-auto w-full object-contain"
              sizes="(min-width: 768px) 17.5rem, 18rem"
              priority
            />
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href="/account/wallet"
          label="کیف پول"
          value={formatTomanAmount(user.walletBalance)}
          hint="مشاهده کیف پول"
          icon={WalletIcon}
          iconTone="bg-gold/15 text-gold-deep"
        />
        <StatCard
          href="/account/requests"
          label="در حال پیگیری"
          value={`${toFaDigits(pending.length)} درخواست`}
          hint="مشاهده همه"
          icon={ScaleIcon}
          iconTone="bg-navy/8 text-navy"
        />
        <StatCard
          href="/account/requests"
          label="لغو شده"
          value={`${toFaDigits(cancelled.length)} درخواست`}
          hint="مشاهده همه"
          icon={XCircleIcon}
          iconTone="bg-red-50 text-red-600"
        />
        <StatCard
          href="/account/cases"
          label="پرونده‌ها"
          value={`${toFaDigits(0)} پرونده`}
          hint="مشاهده همه"
          icon={FolderOpenIcon}
          iconTone="bg-emerald-50 text-emerald-700"
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[16.5rem_minmax(0,1fr)_16.5rem]">
        <aside className={cn(card, "order-2 p-5 xl:order-1")}>
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-navy">
            <BellIcon className="size-4 text-gold" />
            اعلان‌های اخیر
          </h2>
          {notices.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-navy/55">هنوز اعلانی از درخواست‌ها نیست.</p>
          ) : (
            <ul className="mt-4 space-y-1">
              {notices.map((item) => {
                const Icon = noticeIcon(item.status);
                return (
                  <li key={item.id}>
                    <Link
                      href={`/account/requests/${item.trackingCode}`}
                      className="flex items-start gap-3 rounded-xl p-2 transition hover:bg-navy/[0.03]"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                          tableStatusTone[item.status],
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-navy">
                          {consultationStatusMeta[item.status].title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-navy/50">{item.subject}</span>
                        <span className="mt-0.5 block text-[11px] text-navy/40">{formatFaRelative(item.createdAt)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className={cn(card, "order-1 min-w-0 overflow-hidden xl:order-2")}>
          <div className="flex items-center justify-between gap-3 px-5 py-4 md:px-6">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-navy">
              <ClipboardListIcon className="size-4 text-gold" />
              آخرین درخواست‌ها
            </h2>
            {items.length > 0 ? (
              <Link href="/account/requests" className="inline-flex items-center gap-0.5 text-xs font-medium text-gold-deep hover:underline">
                مشاهده همه
                <ChevronLeftIcon className="size-3.5" />
              </Link>
            ) : null}
          </div>
          {rows.length === 0 ? (
            <EmptyRequests />
          ) : (
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm md:min-w-0">
                <thead>
                  <tr className="border-y border-navy/8 text-start text-[11px] text-navy/40">
                    <th className="hidden px-4 py-2.5 font-medium md:table-cell md:px-5">ردیف</th>
                    <th className="px-4 py-2.5 font-medium md:px-5">عنوان</th>
                    <th className="px-4 py-2.5 font-medium md:px-5">تاریخ</th>
                    <th className="px-4 py-2.5 font-medium md:px-5">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item, index) => (
                    <tr key={item.id} className="border-b border-navy/6 last:border-b-0">
                      <td className="hidden px-4 py-3.5 text-navy/40 md:table-cell md:px-5">{toFaDigits(index + 1)}</td>
                      <td className="max-w-0 px-4 py-3.5 md:px-5">
                        <Link
                          href={`/account/requests/${item.trackingCode}`}
                          className="block truncate font-medium text-navy hover:text-gold-deep"
                        >
                          {item.subject}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-navy/50 md:px-5">{formatFaDate(item.createdAt)}</td>
                      <td className="px-4 py-3.5 md:px-5">
                        <span
                          className={cn(
                            "inline-flex max-w-[9.5rem] truncate rounded-full px-2.5 py-1 text-[11px] font-medium md:max-w-none",
                            tableStatusTone[item.status],
                          )}
                        >
                          {consultationStatusMeta[item.status].title}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className={cn(card, "order-3 p-5")}>
          <h2 className="font-heading text-base font-semibold text-navy">خدمات سریع</h2>
          <ul className="mt-3 space-y-1">
            {quickServices.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-navy/[0.03]"
                  >
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", item.tone)}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-navy">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-navy/45">{item.hint}</span>
                    </span>
                    <ChevronLeftIcon className="size-4 shrink-0 text-navy/25" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      {cancelledNotice ? (
        <div className="flex flex-col gap-3 rounded-[1.35rem] border border-red-100 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <XCircleIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">درخواست لغو شد</p>
              <p className="mt-0.5 truncate text-xs leading-6 text-red-800/70">
                {cancelledNotice.subject} · {formatFaDate(cancelledNotice.createdAt)}
              </p>
            </div>
          </div>
          <Link
            href={`/account/requests/${cancelledNotice.trackingCode}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 w-full shrink-0 border-red-200 bg-white px-4 text-red-800 hover:bg-red-100 hover:text-red-900 sm:w-auto",
            )}
          >
            جزئیات درخواست
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  iconTone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof ScaleIcon;
  href: string;
  iconTone: string;
}) {
  return (
    <Link href={href} className={cn(card, "block p-4 transition hover:border-navy/20 hover:shadow-md sm:p-5")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-navy/45">{label}</p>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconTone)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 truncate font-heading text-lg font-bold leading-8 text-navy sm:text-xl">{value}</p>
      <p className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-gold-deep">
        {hint}
        <ChevronLeftIcon className="size-3.5" />
      </p>
    </Link>
  );
}

function noticeIcon(status: ConsultationStatus) {
  if (status === "cancelled") return XCircleIcon;
  if (status === "in-progress" || status === "closed") return CheckCircle2Icon;
  return BellIcon;
}

function EmptyRequests() {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-heading text-sm font-semibold text-navy">هنوز درخواستی ثبت نشده</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-navy/55">
        با ثبت اولین درخواست، وضعیت همین‌جا در جدول نمایش داده می‌شود.
      </p>
      <Link
        href="/account/consult"
        className={cn(buttonVariants({ size: "lg" }), "mt-5 inline-flex h-10 bg-gold px-5 text-navy-deep hover:bg-gold")}
      >
        شروع ثبت درخواست
      </Link>
    </div>
  );
}
