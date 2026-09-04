"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { adminFetch } from "@/components/admin/admin-ui";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";

type UserDetail = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  walletBalance: number;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
  openSupportTickets: number;
  consultations: Array<{
    trackingCode: string;
    subject: string;
    statusLabel: string;
    serviceTitle: string;
    feeToman: number;
    createdAt: string;
  }>;
  conversations: Array<{
    id: string;
    subject: string;
    trackingCode: string;
    lawyerName: string;
    closedAt?: string;
    createdAt: string;
  }>;
  cases: Array<{
    id: string;
    caseNumber: string;
    title: string;
    status: string;
    lawyerName: string;
    updatedAt: string;
  }>;
  walletEntries: Array<{
    id: string;
    amount: number;
    reason: string;
    note?: string | null;
    createdAt: string;
  }>;
};

export function AdminUserDetailPanel() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [item, setItem] = useState<UserDetail | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletNote, setWalletNote] = useState("");

  const load = useCallback(async () => {
    const result = await adminFetch<{ item: UserDetail }>(`/api/admin?view=user&id=${encodeURIComponent(userId)}`);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItem(result.data.item);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive() {
    if (!item) return;
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "set-user-active", userId: item.id, active: !item.active }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(item.active ? "حساب غیرفعال شد." : "حساب فعال شد.");
    await load();
  }

  async function adjustWallet(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    const amount = Number(walletAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      setError("مبلغ تعدیل نامعتبر است.");
      return;
    }
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        action: "adjust-wallet",
        userId: item.id,
        amount,
        note: walletNote || undefined,
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("کیف‌پول به‌روز شد.");
    setWalletAmount("");
    setWalletNote("");
    await load();
  }

  async function resetPassword() {
    if (!item) return;
    const password = window.prompt("رمز جدید کاربر (حداقل ۶ کاراکتر):");
    if (!password) return;
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "reset-client-password", userId: item.id, password }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("رمز کاربر بازنشانی شد.");
  }

  async function openSupportTicket() {
    if (!item) return;
    const subject = window.prompt("موضوع تیکت پشتیبانی:", `پیگیری کاربر ${item.fullName}`);
    if (!subject) return;
    const body = window.prompt("شرح مشکل:", "") ?? "";
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        action: "create-support",
        fullName: item.fullName,
        phone: item.phone,
        subject,
        body: body || `ثبت تیکت برای کاربر ${item.fullName}`,
        userId: item.id,
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("تیکت پشتیبانی ثبت شد.");
    await load();
  }

  if (!item && !error) {
    return <p className="text-sm text-navy/50">در حال بارگذاری…</p>;
  }
  if (!item) {
    return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-gold-deep hover:underline">
        بازگشت به کاربران
      </Link>
      <p className="mt-4 text-xs font-semibold tracking-wide text-gold-deep">جزئیات کاربر</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">{item.fullName}</h1>
      <p className="mt-2 text-sm text-navy/55" dir="ltr">
        {toFaDigits(item.phone)}
        {item.email ? ` · ${item.email}` : ""}
      </p>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="وضعیت" value={item.active ? "فعال" : "غیرفعال"} />
        <Info label="کیف‌پول" value={formatTomanAmount(item.walletBalance)} />
        <Info label="عضویت" value={formatFaDateTime(item.createdAt)} />
        <Info label="آخرین ورود" value={item.lastLoginAt ? formatFaDateTime(item.lastLoginAt) : "—"} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void toggleActive()}
          className="rounded-xl border border-navy/15 px-3 py-2 text-xs disabled:opacity-60"
        >
          {item.active ? "غیرفعال کردن" : "فعال کردن"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void resetPassword()}
          className="rounded-xl border border-navy/15 px-3 py-2 text-xs disabled:opacity-60"
        >
          بازنشانی رمز
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void openSupportTicket()}
          className="rounded-xl bg-navy px-3 py-2 text-xs font-medium text-gold disabled:opacity-60"
        >
          تیکت پشتیبانی
        </button>
        {item.openSupportTickets > 0 ? (
          <Link href="/admin/support" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {toFaDigits(item.openSupportTickets)} تیکت باز
          </Link>
        ) : null}
      </div>

      <form onSubmit={adjustWallet} className="mt-8 grid gap-3 rounded-xl border border-navy/10 bg-white p-5 sm:grid-cols-[1fr_1fr_auto]">
        <h2 className="sm:col-span-3 font-heading text-lg font-semibold">تعدیل کیف‌پول</h2>
        <input
          value={walletAmount}
          onChange={(e) => setWalletAmount(e.target.value)}
          placeholder="± مبلغ تومان"
          className="rounded-xl border border-navy/15 px-3 py-2 text-sm"
          dir="ltr"
        />
        <input
          value={walletNote}
          onChange={(e) => setWalletNote(e.target.value)}
          placeholder="دلیل (اختیاری)"
          className="rounded-xl border border-navy/15 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-gold disabled:opacity-60"
        >
          ثبت
        </button>
      </form>

      <Section title="تاریخچه کیف‌پول">
        {item.walletEntries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-navy/50">تراکنشی نیست.</p>
        ) : (
          item.walletEntries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{entry.reason}</p>
                <p className="text-xs text-navy/45">
                  {entry.note ? `${entry.note} · ` : ""}
                  {formatFaDateTime(entry.createdAt)}
                </p>
              </div>
              <span className={entry.amount >= 0 ? "text-emerald-700" : "text-red-700"}>
                {entry.amount >= 0 ? "+" : ""}
                {formatTomanAmount(entry.amount)}
              </span>
            </div>
          ))
        )}
      </Section>

      <Section title="درخواست‌ها">
        {item.consultations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-navy/50">درخواستی نیست.</p>
        ) : (
          item.consultations.map((c) => (
            <Link
              key={c.trackingCode}
              href={`/admin/requests/${c.trackingCode}`}
              className="block px-4 py-3 text-sm hover:bg-navy/[0.03]"
            >
              <p className="font-medium text-navy">{c.subject}</p>
              <p className="text-xs text-navy/45">
                {toFaDigits(c.trackingCode)} · {c.statusLabel} · {c.serviceTitle} · {formatTomanAmount(c.feeToman)}
              </p>
            </Link>
          ))
        )}
      </Section>

      <Section title="گفتگوها">
        {item.conversations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-navy/50">گفتگویی نیست.</p>
        ) : (
          item.conversations.map((c) => (
            <div key={c.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{c.subject}</p>
              <p className="text-xs text-navy/45">
                {c.lawyerName} · {c.closedAt ? "بسته" : "باز"} · {formatFaDateTime(c.createdAt)}
              </p>
            </div>
          ))
        )}
      </Section>

      <Section title="پرونده‌ها">
        {item.cases.length === 0 ? (
          <p className="px-4 py-6 text-sm text-navy/50">پرونده‌ای نیست.</p>
        ) : (
          item.cases.map((c) => (
            <div key={c.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{c.title}</p>
              <p className="text-xs text-navy/45">
                {toFaDigits(c.caseNumber)} · {c.status} · {c.lawyerName}
              </p>
            </div>
          ))
        )}
      </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-heading text-lg font-semibold text-navy">{title}</h2>
      <div className="mt-3 divide-y divide-navy/8 overflow-hidden rounded-xl border border-navy/10 bg-white">
        {children}
      </div>
    </section>
  );
}
