import type { Metadata } from "next";

import { consultChannelMeta, consultationStatusMeta, type ConsultChannel, type ConsultationStatus } from "@/lib/consult";
import { prisma } from "@/lib/db";
import { formatFaDateTime, toFaDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "نمای کلی مدیریت",
};

export default async function AdminHomePage() {
  const [clientCount, lawyerCount, staffCount, consultCount, chatCount, recent] = await Promise.all([
    prisma.user.count({ where: { role: "client" } }),
    prisma.user.count({ where: { role: "lawyer" } }),
    prisma.user.count({ where: { role: { in: ["admin", "manager"] } } }),
    prisma.consultation.count(),
    prisma.conversation.count(),
    prisma.consultation.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        trackingCode: true,
        status: true,
        channel: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-gold-deep">پیشخوان</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">نمای کلی</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">
        این پنل برای ادمین و مدیر دفتر است. متن گفتگو و شرح درخواست موکل اینجا نمایش داده نمی‌شود.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="موکل" value={toFaDigits(clientCount)} />
        <Stat label="وکیل" value={toFaDigits(lawyerCount)} />
        <Stat label="درخواست" value={toFaDigits(consultCount)} />
        <Stat label="گفتگوی بازشده" value={toFaDigits(chatCount)} />
      </div>
      <p className="mt-3 text-xs text-navy/40">حساب مدیریت: {toFaDigits(staffCount)}</p>

      <h2 className="mt-10 font-heading text-lg font-semibold text-navy">آخرین درخواست‌ها</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-navy/10 bg-white">
        {recent.length === 0 ? (
          <p className="px-4 py-8 text-sm text-navy/50">هنوز درخواستی ثبت نشده است.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-navy/[0.03] text-start text-xs text-navy/50">
              <tr>
                <th className="px-4 py-3 font-medium">کد</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">کانال</th>
                <th className="px-4 py-3 font-medium">زمان</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((item) => (
                <tr key={item.trackingCode} className="border-t border-navy/8">
                  <td className="px-4 py-3 font-medium">
                    {toFaDigits(item.trackingCode)}
                  </td>
                  <td className="px-4 py-3">
                    {consultationStatusMeta[item.status as ConsultationStatus]?.title ?? item.status}
                  </td>
                  <td className="px-4 py-3">
                    {consultChannelMeta[item.channel as ConsultChannel]?.title ?? item.channel}
                  </td>
                  <td className="px-4 py-3 text-navy/50">{formatFaDateTime(item.createdAt.toISOString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white px-4 py-4">
      <p className="text-xs text-navy/45">{label}</p>
      <p className="mt-2 font-heading text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}
