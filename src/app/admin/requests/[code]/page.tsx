import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { canStaff } from "@/lib/admin-permissions";
import { getConsultationForStaff, refreshAdminCaches } from "@/lib/admin-ops";
import { getServerUser } from "@/lib/auth";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "جزئیات درخواست",
};

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getServerUser();
  await refreshAdminCaches();
  const includeSecrets = canStaff(user?.role, "viewRequestSecrets");
  const item = await getConsultationForStaff(code, includeSecrets);
  if (!item) notFound();

  return (
    <div>
      <Link href="/admin/requests" className="text-sm text-gold-deep hover:underline">
        بازگشت به فهرست
      </Link>
      <p className="mt-4 text-xs font-semibold tracking-wide text-gold-deep">جزئیات</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">{item.subject}</h1>
      <p className="mt-2 text-sm text-navy/55">
        کد {toFaDigits(item.trackingCode)} · {item.statusLabel} · {item.serviceTitle}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Info label="موکل" value={`${item.client.fullName} — ${toFaDigits(item.client.phone)}`} />
        <Info label="کانال" value={item.channelLabel} />
        <Info label="شهر" value={item.city || "—"} />
        <Info label="وکیل" value={item.lawyerName || "—"} />
        <Info label="مبلغ" value={formatTomanAmount(item.feeToman)} />
        <Info label="پرداخت" value={item.paymentStatus} />
        <Info label="ثبت" value={formatFaDateTime(item.createdAt)} />
        <Info label="کیف‌پول موکل" value={formatTomanAmount(item.client.walletBalance)} />
      </div>

      {includeSecrets ? (
        <section className="mt-10 rounded-xl border border-navy/10 bg-white p-5">
          <h2 className="font-heading text-lg font-semibold text-navy">شرح درخواست (فقط مدیر — مشاهده)</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-navy/75">{item.secrets?.message}</p>

          {item.secrets?.messages && item.secrets.messages.length > 0 ? (
            <>
              <h3 className="mt-8 text-sm font-semibold text-navy">پیام‌های گفتگو (فقط مشاهده)</h3>
              <ul className="mt-3 space-y-3">
                {item.secrets.messages.map((msg) => (
                  <li key={msg.id} className="rounded-lg bg-navy/[0.03] px-3 py-3 text-sm">
                    <p className="text-[11px] text-navy/40">
                      {msg.authorRole} · {formatFaDateTime(msg.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-navy/80">{msg.body}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-sm text-navy/45">هنوز پیام گفتگویی ثبت نشده است.</p>
          )}
        </section>
      ) : (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          مشاهده متن درخواست و گفتگو فقط برای نقش مدیر فعال است.
        </p>
      )}

      {item.documents.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold">مدارک پیوست</h2>
          <ul className="mt-3 divide-y divide-navy/8 overflow-hidden rounded-xl border border-navy/10 bg-white">
            {item.documents.map((doc) => (
              <li key={doc.id} className="px-4 py-3 text-sm">
                {doc.originalName}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white px-4 py-3">
      <p className="text-xs text-navy/45">{label}</p>
      <p className="mt-1 text-sm font-medium text-navy">{value}</p>
    </div>
  );
}
