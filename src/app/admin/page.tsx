import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangleIcon,
  ClipboardListIcon,
  HandshakeIcon,
  HeadsetIcon,
  ScaleIcon,
  WalletIcon,
} from "lucide-react";

import { AdminHeading, AdminSectionCard, AdminStatTile, panelCard } from "@/components/admin/admin-ui";
import { getAdminDashboard, refreshAdminCaches } from "@/lib/admin-ops";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "نمای کلی مدیریت",
};

export default async function AdminHomePage() {
  await refreshAdminCaches();
  const data = await getAdminDashboard();

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <AdminHeading
        kicker="پیشخوان"
        title="نمای کلی"
        description="نمای زنده از کاربران، صف عملیات، مالی، کیفیت و پشتیبانی. جزئیات متن گفتگو فقط برای مدیر در صفحهٔ درخواست است."
        actions={
          <>
            <Link
              href="/admin/queue"
              className="rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-gold transition hover:bg-navy-deep"
            >
              صف عملیات
            </Link>
            <Link
              href="/admin/support"
              className="rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy transition hover:border-gold/40"
            >
              پشتیبانی
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatTile label="کاربر" value={toFaDigits(data.clientCount)} href="/admin/users" />
        <AdminStatTile label="وکیل فعال" value={toFaDigits(data.lawyerCount)} href="/admin/lawyers" />
        <AdminStatTile label="درخواست کل" value={toFaDigits(data.consultCount)} href="/admin/requests" />
        <AdminStatTile label="گفتگوی باز" value={toFaDigits(data.openChats)} />
      </div>

      <AdminSectionCard title="نیازمند اقدام" hint="مواردی که امروز نیاز به رسیدگی دارند.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <AlertStat
            label="منتظر اپراتور"
            value={toFaDigits(data.awaitingOperator)}
            href="/admin/queue"
            tone="bg-amber-50 text-amber-900"
            icon={ClipboardListIcon}
          />
          <AlertStat
            label="فوری بدون وکیل"
            value={toFaDigits(data.urgentWaiting)}
            href="/admin/queue"
            tone="bg-red-50 text-red-800"
            icon={AlertTriangleIcon}
          />
          <AlertStat
            label="تیکت پشتیبانی باز"
            value={toFaDigits(data.openTickets)}
            href="/admin/support"
            tone="bg-sky-50 text-sky-900"
            icon={HeadsetIcon}
          />
          <AlertStat
            label="همکاری در انتظار"
            value={toFaDigits(data.pendingCooperations)}
            href="/admin/cooperate"
            tone="bg-violet-50 text-violet-900"
            icon={HandshakeIcon}
          />
          <AlertStat
            label="هشدار وکلا"
            value={toFaDigits(data.qualityAlerts.length)}
            href="/admin/lawyers"
            tone="bg-orange-50 text-orange-900"
            icon={ScaleIcon}
          />
        </div>
      </AdminSectionCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatTile label="بسته‌شده" value={toFaDigits(data.closedCount)} />
        <AdminStatTile label="لغوشده" value={toFaDigits(data.cancelledCount)} />
        <AdminStatTile label="استرداد کیف‌پول" value={toFaDigits(data.refundedCount)} />
        <AdminStatTile
          label="میانگین امتیاز"
          value={data.ratingCount ? toFaDigits(Number(data.avgRating.toFixed(1))) : "—"}
          hint={data.ratingCount ? `${toFaDigits(data.ratingCount)} نظر` : "هنوز نظری نیست"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminStatTile
          label="جمع کیف‌پول کاربران"
          value={formatTomanAmount(data.walletSum)}
          href="/admin/users"
        />
        <AdminStatTile label="حساب مدیریت" value={toFaDigits(data.staffCount)} href="/admin/staff" />
      </div>

      {data.qualityAlerts.length > 0 ? (
        <AdminSectionCard title="هشدار کیفیت / ظرفیت وکلا">
          <ul className="divide-y divide-navy/8 overflow-hidden rounded-xl border border-orange-200 bg-orange-50/40">
            {data.qualityAlerts.map((alert) => (
              <li key={alert.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <Link href={`/admin/lawyers/${alert.slug}`} className="font-medium text-navy hover:text-gold-deep">
                    {alert.fullName}
                  </Link>
                  <p className="mt-1 text-xs text-navy/55">
                    {alert.lowQuality
                      ? `کیفیت: امتیاز ${toFaDigits(Number(alert.avgRating.toFixed(1)))} · رد ${toFaDigits(alert.rejectRate)}٪`
                      : null}
                    {alert.lowQuality && alert.overCapacity ? " · " : ""}
                    {alert.overCapacity ? `ظرفیت: ${toFaDigits(alert.openChats)} گفتگوی باز` : null}
                  </p>
                </div>
                <Link href={`/admin/lawyers/${alert.slug}`} className="text-xs text-gold-deep hover:underline">
                  بررسی
                </Link>
              </li>
            ))}
          </ul>
        </AdminSectionCard>
      ) : null}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <AdminSectionCard title="توزیع وضعیت درخواست">
          <ul className="divide-y divide-navy/8">
            {data.statusBreakdown.length === 0 ? (
              <li className="py-4 text-sm text-navy/50">داده‌ای نیست.</li>
            ) : (
              data.statusBreakdown.map((row) => (
                <li key={row.status} className="flex items-center justify-between py-3 text-sm">
                  <span>{row.label}</span>
                  <span className="font-medium text-navy">{toFaDigits(row.count)}</span>
                </li>
              ))
            )}
          </ul>
        </AdminSectionCard>

        <AdminSectionCard title="آخرین حرکت کیف‌پول" action={<WalletIcon className="size-4 text-navy/35" />}>
          <ul className="divide-y divide-navy/8">
            {data.recentWallet.length === 0 ? (
              <li className="py-4 text-sm text-navy/50">تراکنشی نیست.</li>
            ) : (
              data.recentWallet.map((row, index) => (
                <li key={`${row.createdAt}-${index}`} className="py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-navy">{row.userName}</span>
                    <span className={row.amount >= 0 ? "text-emerald-700" : "text-red-700"}>
                      {row.amount >= 0 ? "+" : ""}
                      {formatTomanAmount(row.amount)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-navy/45">
                    {row.reason} · {formatFaDateTime(row.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </AdminSectionCard>
      </div>

      <AdminSectionCard
        title="آخرین درخواست‌ها"
        action={
          <Link href="/admin/requests" className="text-xs text-navy/50 hover:text-navy">
            همه
          </Link>
        }
      >
        <div className={cn(panelCard, "overflow-hidden border-0 p-0 shadow-none ring-1 ring-navy/8")}>
          {data.recent.length === 0 ? (
            <p className="px-4 py-8 text-sm text-navy/50">هنوز درخواستی ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="bg-navy/[0.03] text-start text-xs text-navy/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">کد</th>
                    <th className="px-4 py-3 font-medium">سرویس</th>
                    <th className="px-4 py-3 font-medium">وضعیت</th>
                    <th className="px-4 py-3 font-medium">کانال</th>
                    <th className="px-4 py-3 font-medium">زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((item) => (
                    <tr key={item.trackingCode} className="border-t border-navy/8">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/admin/requests/${item.trackingCode}`} className="text-navy hover:text-gold-deep">
                          {toFaDigits(item.trackingCode)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-navy/65">{item.serviceTitle}</td>
                      <td className="px-4 py-3">{item.statusLabel}</td>
                      <td className="px-4 py-3">{item.channelLabel}</td>
                      <td className="px-4 py-3 text-navy/50">{formatFaDateTime(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminSectionCard>
    </div>
  );
}

function AlertStat({
  label,
  value,
  href,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  href: string;
  tone: string;
  icon: typeof ClipboardListIcon;
}) {
  return (
    <Link href={href} className={cn("rounded-xl border border-navy/10 px-4 py-4 transition hover:shadow-sm", tone)}>
      <span className="mb-3 flex size-8 items-center justify-center rounded-lg bg-white/60">
        <Icon className="size-4" />
      </span>
      <p className="text-xs opacity-70">{label}</p>
      <p className="mt-2 font-heading text-2xl font-bold">{value}</p>
    </Link>
  );
}
