import type { Metadata } from "next";

import { consultChannelMeta, consultationStatusMeta, type ConsultChannel, type ConsultationStatus } from "@/lib/consult";
import { prisma } from "@/lib/db";
import { formatFaDateTime, toFaDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "درخواست‌های مدیریت",
};

export default async function AdminRequestsPage() {
  const items = await prisma.consultation.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      trackingCode: true,
      status: true,
      channel: true,
      createdAt: true,
      lawyerMode: true,
      lawyerSlug: true,
      paymentStatus: true,
    },
  });

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-gold-deep">عملیات</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">درخواست‌ها</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">
        فهرست عملیاتی بدون متن مشاوره و مشخصات تماس موکل. برای جزئیات پرونده باید از مسیر مجاز وکیل یا موکل وارد شد.
      </p>
      <div className="mt-8 overflow-hidden rounded-xl border border-navy/10 bg-white">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-sm text-navy/50">موردی نیست.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-navy/[0.03] text-start text-xs text-navy/50">
              <tr>
                <th className="px-4 py-3 font-medium">کد</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">کانال</th>
                <th className="px-4 py-3 font-medium">انتخاب وکیل</th>
                <th className="px-4 py-3 font-medium">پرداخت</th>
                <th className="px-4 py-3 font-medium">زمان</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
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
                  <td className="px-4 py-3 text-navy/60">
                    {item.lawyerMode === "assign" ? "معرفی دفتر" : "انتخاب موکل"}
                  </td>
                  <td className="px-4 py-3 text-navy/60">{item.paymentStatus}</td>
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
