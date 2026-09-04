import type { Metadata } from "next";
import Link from "next/link";

import { getAdminDashboard, refreshAdminCaches } from "@/lib/admin-ops";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "نمای کلی مدیریت",
};

export default async function AdminHomePage() {
  await refreshAdminCaches();
  const data = await getAdminDashboard();

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-gold-deep">پیشخوان</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">نمای کلی</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">
        نمای زنده از کاربران، صف عملیات، مالی، کیفیت و پشتیبانی. جزئیات متن گفتگو فقط برای مدیر در صفحهٔ درخواست است.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="کاربر" value={toFaDigits(data.clientCount)} href="/admin/users" />
        <Stat label="وکیل فعال" value={toFaDigits(data.lawyerCount)} href="/admin/lawyers" />
        <Stat label="درخواست کل" value={toFaDigits(data.consultCount)} href="/admin/requests" />
        <Stat label="گفتگوی باز" value={toFaDigits(data.openChats)} />
      </div>

      <h2 className="mt-10 font-heading text-lg font-semibold text-navy">نیازمند اقدام</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <AlertStat label="منتظر اپراتور" value={toFaDigits(data.awaitingOperator)} href="/admin/queue" tone="bg-amber-50 text-amber-900" />
        <AlertStat label="فوری بدون وکیل" value={toFaDigits(data.urgentWaiting)} href="/admin/queue" tone="bg-red-50 text-red-800" />
        <AlertStat label="تیکت پشتیبانی باز" value={toFaDigits(data.openTickets)} href="/admin/support" tone="bg-sky-50 text-sky-900" />
        <AlertStat label="همکاری در انتظار" value={toFaDigits(data.pendingCooperations)} href="/admin/cooperate" tone="bg-violet-50 text-violet-900" />
        <AlertStat label="هشدار وکلا" value={toFaDigits(data.qualityAlerts.length)} href="/admin/lawyers" tone="bg-orange-50 text-orange-900" />
      </div>

      <h2 className="mt-10 font-heading text-lg font-semibold text-navy">وضعیت سامانه</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="بسته‌شده" value={toFaDigits(data.closedCount)} />
        <Stat label="لغوشده" value={toFaDigits(data.cancelledCount)} />
        <Stat label="استرداد کیف‌پول" value={toFaDigits(data.refundedCount)} />
        <Stat
          label="میانگین امتیاز"
          value={data.ratingCount ? toFaDigits(Number(data.avgRating.toFixed(1))) : "—"}
          hint={data.ratingCount ? `${toFaDigits(data.ratingCount)} نظر` : "هنوز نظری نیست"}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Stat label="جمع کیف‌پول کاربران" value={formatTomanAmount(data.walletSum)} href="/admin/users" />
        <Stat label="حساب مدیریت" value={toFaDigits(data.staffCount)} href="/admin/staff" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/admin/queue" className="rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-gold transition hover:bg-navy-deep">
          صف عملیات
        </Link>
        <Link href="/admin/support" className="rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy transition hover:border-gold/40">
          پشتیبانی
        </Link>
        <Link href="/admin/requests" className="rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy transition hover:border-gold/40">
          درخواست‌ها
        </Link>
      </div>

      {data.qualityAlerts.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-heading text-lg font-semibold text-navy">هشدار کیفیت / ظرفیت وکلا</h2>
          <ul className="mt-4 divide-y divide-navy/8 overflow-hidden rounded-xl border border-orange-200 bg-orange-50/40">
            {data.qualityAlerts.map((alert) => (
              <li key={alert.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
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
        </section>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-heading text-lg font-semibold text-navy">توزیع وضعیت درخواست</h2>
          <ul className="mt-4 divide-y divide-navy/8 overflow-hidden rounded-xl border border-navy/10 bg-white">
            {data.statusBreakdown.length === 0 ? (
              <li className="px-4 py-6 text-sm text-navy/50">داده‌ای نیست.</li>
            ) : (
              data.statusBreakdown.map((row) => (
                <li key={row.status} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>{row.label}</span>
                  <span className="font-medium text-navy">{toFaDigits(row.count)}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-navy">آخرین حرکت کیف‌پول</h2>
          <ul className="mt-4 divide-y divide-navy/8 overflow-hidden rounded-xl border border-navy/10 bg-white">
            {data.recentWallet.length === 0 ? (
              <li className="px-4 py-6 text-sm text-navy/50">تراکنشی نیست.</li>
            ) : (
              data.recentWallet.map((row, index) => (
                <li key={`${row.createdAt}-${index}`} className="px-4 py-3 text-sm">
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
        </section>
      </div>

      <h2 className="mt-10 font-heading text-lg font-semibold text-navy">آخرین درخواست‌ها</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-navy/10 bg-white">
        {data.recent.length === 0 ? (
          <p className="px-4 py-8 text-sm text-navy/50">هنوز درخواستی ثبت نشده است.</p>
        ) : (
          <table className="w-full text-sm">
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
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  const inner = (
    <>
      <p className="text-xs text-navy/45">{label}</p>
      <p className="mt-2 font-heading text-2xl font-bold text-navy">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-navy/40">{hint}</p> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="rounded-xl border border-navy/10 bg-white px-4 py-4 transition hover:border-gold/40">
        {inner}
      </Link>
    );
  }
  return <div className="rounded-xl border border-navy/10 bg-white px-4 py-4">{inner}</div>;
}

function AlertStat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: string;
  href: string;
  tone: string;
}) {
  return (
    <Link href={href} className={`rounded-xl border border-navy/10 px-4 py-4 ${tone}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="mt-2 font-heading text-2xl font-bold">{value}</p>
    </Link>
  );
}
