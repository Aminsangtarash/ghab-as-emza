"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { adminFetch } from "@/components/admin/admin-ui";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";

type QueueItem = {
  trackingCode: string;
  statusLabel: string;
  channelLabel: string;
  serviceTitle: string;
  subject: string;
  city?: string | null;
  feeToman: number;
  createdAt: string;
  clientName: string;
  clientPhone: string;
};

type LawyerOption = { slug: string; fullName: string; active: boolean };

export function AdminQueuePanel() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [lawyers, setLawyers] = useState<LawyerOption[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [assignSlug, setAssignSlug] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [queue, lawyerList] = await Promise.all([
      adminFetch<{ items: QueueItem[] }>("/api/admin?view=queue"),
      adminFetch<{ items: LawyerOption[] }>("/api/admin?view=lawyers"),
    ]);
    if (queue.ok) setItems(queue.data.items);
    else setError(queue.error);
    if (lawyerList.ok) setLawyers(lawyerList.data.items.filter((l) => l.active && l.slug));
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

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-gold-deep">عملیات</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">صف عملیات</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">
        درخواست‌های منتظر اپراتور یا بدون وکیل. انتساب دستی یا لغو با استرداد از اینجا انجام می‌شود.
      </p>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

      <div className="mt-8 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-navy/10 bg-white px-5 py-10 text-center text-sm text-navy/50">
            صف خالی است.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.trackingCode} className="rounded-xl border border-navy/10 bg-white p-4 sm:p-5">
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
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[16rem]">
                  <select
                    className="rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm"
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
                      لغو
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
