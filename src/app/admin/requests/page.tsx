import type { Metadata } from "next";
import Link from "next/link";

import { AdminEmptyRow, AdminHeading, panelCard } from "@/components/admin/admin-ui";
import { consultChannelMeta, consultationStatusMeta, type ConsultChannel, type ConsultationStatus } from "@/lib/consult";
import { prisma } from "@/lib/db";
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "درخواست‌های مدیریت",
};

export default async function AdminRequestsPage() {
  const items = await prisma.consultation.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      trackingCode: true,
      status: true,
      channel: true,
      createdAt: true,
      lawyerMode: true,
      lawyerSlug: true,
      paymentStatus: true,
      service: true,
      subject: true,
      city: true,
    },
  });

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <AdminHeading
        kicker="عملیات"
        title="درخواست‌ها"
        description="فهرست عملیاتی. متن کامل مشاوره و پیام‌ها فقط برای مدیر در جزئیات قابل مشاهده است."
      />
      {items.length === 0 ? (
        <AdminEmptyRow>موردی نیست.</AdminEmptyRow>
      ) : (
        <div className={cn(panelCard, "overflow-hidden p-0")}>
          <table className="w-full text-sm">
            <thead className="bg-navy/[0.03] text-start text-xs text-navy/50">
              <tr>
                <th className="px-4 py-3 font-medium">کد</th>
                <th className="px-4 py-3 font-medium">موضوع</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">کانال</th>
                <th className="px-4 py-3 font-medium">زمان</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.trackingCode} className="border-t border-navy/8">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/requests/${item.trackingCode}`} className="hover:text-gold-deep">
                      {toFaDigits(item.trackingCode)}
                    </Link>
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-3 text-navy/70">{item.subject}</td>
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
        </div>
      )}
    </div>
  );
}
