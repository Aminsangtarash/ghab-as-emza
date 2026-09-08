"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  AdminEmptyRow,
  AdminErrorNote,
  AdminHeading,
  AdminOkNote,
  adminFetch,
  adminInputClass,
  panelCard,
} from "@/components/admin/admin-ui";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type QueueItem = {
  trackingCode: string;
  status: string;
  statusLabel: string;
  channelLabel: string;
  serviceTitle: string;
  subject: string;
  city?: string | null;
  feeToman: number;
  createdAt: string;
  clientName: string;
  clientPhone: string;
  lastRejectReason?: string | null;
  cancelReason?: string | null;
};

type LawyerOption = { slug: string; fullName: string; active: boolean };

type PayoutItem = {
  id: string;
  amountToman: number;
  status: string;
  bankIban: string;
  bankAccountName: string;
  userNote: string | null;
  createdAt: string;
  user: { id: string; fullName: string; phone: string; walletBalance: number };
};

export function AdminQueuePanel() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [lawyers, setLawyers] = useState<LawyerOption[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [assignSlug, setAssignSlug] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [queue, lawyerList, payoutList] = await Promise.all([
      adminFetch<{ items: QueueItem[] }>("/api/admin?view=queue"),
      adminFetch<{ items: LawyerOption[] }>("/api/admin?view=lawyers"),
      adminFetch<{ items: PayoutItem[] }>("/api/admin?view=payouts"),
    ]);
    if (queue.ok) setItems(queue.data.items);
    else setError(queue.error);
    if (lawyerList.ok) setLawyers(lawyerList.data.items.filter((l) => l.active && l.slug));
    if (payoutList.ok) setPayouts(payoutList.data.items);
    else setPayouts([]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function assign(trackingCode: string) {
    const lawyerSlug = assignSlug[trackingCode];
    if (!lawyerSlug) {
      setError("ابتدا وکیل را انتخاب کنید.");
      return;
    }
    setPending(trackingCode);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "assign", trackingCode, lawyerSlug }),
    });
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("وکیل با موفقیت انتساب داده شد.");
    await load();
  }

  async function cancel(trackingCode: string) {
    setPending(trackingCode);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "cancel", trackingCode, reason: "لغو از صف عملیات" }),
    });
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("درخواست لغو و در صورت نیاز استرداد شد.");
    await load();
  }

  async function decideCancel(trackingCode: string, action: "approve-cancel" | "deny-cancel") {
    setPending(trackingCode);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action, trackingCode }),
    });
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(action === "approve-cancel" ? "انصراف تأیید و مبلغ به کیف پول برگشت." : "درخواست انصراف رد شد.");
    await load();
  }

  async function reviewPayout(id: string, decision: "approve" | "reject" | "mark-paid") {
    setPending(id);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "review-payout", id, decision }),
    });
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(
      decision === "approve"
        ? "تسویه تأیید شد؛ پس از واریز پایا، «پرداخت شد» را بزنید."
        : decision === "mark-paid"
          ? "پرداخت پایا ثبت شد."
          : "درخواست تسویه رد و مبلغ به کیف پول برگشت.",
    );
    await load();
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <AdminHeading
        kicker="عملیات"
        title="صف عملیات"
        description="انتساب وکیل، رسیدگی به انتخاب مجدد، تأیید انصراف کاربر (توسط مدیر) و تسویه کیف پول."
      />

      <AdminErrorNote>{error}</AdminErrorNote>
      <AdminOkNote>{message}</AdminOkNote>

      <div className="space-y-3">
        {items.length === 0 ? (
          <AdminEmptyRow>صف خالی است.</AdminEmptyRow>
        ) : (
          items.map((item) => {
            const isCancelRequest = item.status === "cancel-requested";
            return (
              <div key={item.trackingCode} className={cn(panelCard, "p-4 sm:p-5")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/requests/${item.trackingCode}`}
                      className="font-heading text-base font-semibold text-navy hover:text-gold-deep"
                    >
                      {item.subject}
                    </Link>
                    <p className="mt-1 text-xs text-navy/50">
                      {toFaDigits(item.trackingCode)} · {item.serviceTitle} · {item.statusLabel}
                    </p>
                    <p className="mt-2 text-sm text-navy/70">
                      {item.clientName} · <span dir="ltr">{toFaDigits(item.clientPhone)}</span>
                      {item.city ? ` · ${item.city}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-navy/45">
                      {item.channelLabel} · {formatTomanAmount(item.feeToman)} · {formatFaDateTime(item.createdAt)}
                    </p>
                    {item.lastRejectReason ? (
                      <p className="mt-2 text-xs text-orange-800">رد وکیل: {item.lastRejectReason}</p>
                    ) : null}
                    {item.cancelReason && isCancelRequest ? (
                      <p className="mt-2 text-xs text-amber-900">دلیل انصراف: {item.cancelReason}</p>
                    ) : null}
                  </div>

                  {isCancelRequest ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending === item.trackingCode}
                        onClick={() => void decideCancel(item.trackingCode, "approve-cancel")}
                        className="rounded-xl bg-navy px-3 py-2 text-sm font-medium text-gold disabled:opacity-60"
                      >
                        تأیید انصراف و استرداد
                      </button>
                      <button
                        type="button"
                        disabled={pending === item.trackingCode}
                        onClick={() => void decideCancel(item.trackingCode, "deny-cancel")}
                        className="rounded-xl border border-navy/15 px-3 py-2 text-sm disabled:opacity-60"
                      >
                        رد انصراف
                      </button>
                    </div>
                  ) : (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[16rem]">
                      <select
                        className={cn(adminInputClass(), "mt-0")}
                        value={assignSlug[item.trackingCode] ?? ""}
                        onChange={(e) =>
                          setAssignSlug((prev) => ({ ...prev, [item.trackingCode]: e.target.value }))
                        }
                      >
                        <option value="">انتخاب وکیل</option>
                        {lawyers.map((lawyer) => (
                          <option key={lawyer.slug} value={lawyer.slug}>
                            {lawyer.fullName}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={pending === item.trackingCode}
                          onClick={() => void assign(item.trackingCode)}
                          className="flex-1 rounded-xl bg-navy px-3 py-2 text-sm font-medium text-gold disabled:opacity-60"
                        >
                          انتساب
                        </button>
                        <button
                          type="button"
                          disabled={pending === item.trackingCode}
                          onClick={() => void cancel(item.trackingCode)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-60"
                        >
                          لغو فوری
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <section className={cn(panelCard, "p-5")}>
        <h2 className="font-heading text-base font-semibold text-navy">تسویه کیف پول (پایا)</h2>
        <p className="mt-1 text-xs text-navy/45">
          پس از تأیید مدیر، معمولاً ۲ تا ۳ روز کاری تا واریز پایا. فقط مدیر سیستم این بخش را می‌بیند.
        </p>
        <div className="mt-4 space-y-3">
          {payouts.length === 0 ? (
            <p className="text-sm text-navy/50">درخواست تسویه بازی نیست.</p>
          ) : (
            payouts.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-navy/10 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-navy">
                    {item.user.fullName} · {formatTomanAmount(item.amountToman)}
                  </p>
                  <p className="mt-1 text-xs text-navy/50" dir="ltr">
                    {item.bankIban} · {item.bankAccountName}
                  </p>
                  <p className="mt-1 text-xs text-navy/45">
                    وضعیت: {item.status} · {formatFaDateTime(item.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        disabled={pending === item.id}
                        onClick={() => void reviewPayout(item.id, "approve")}
                        className="rounded-xl bg-navy px-3 py-1.5 text-xs text-gold disabled:opacity-60"
                      >
                        تأیید
                      </button>
                      <button
                        type="button"
                        disabled={pending === item.id}
                        onClick={() => void reviewPayout(item.id, "reject")}
                        className="rounded-xl border border-red-200 px-3 py-1.5 text-xs text-red-700"
                      >
                        رد
                      </button>
                    </>
                  ) : null}
                  {item.status === "approved" ? (
                    <button
                      type="button"
                      disabled={pending === item.id}
                      onClick={() => void reviewPayout(item.id, "mark-paid")}
                      className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs text-white"
                    >
                      پرداخت شد (پایا)
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
