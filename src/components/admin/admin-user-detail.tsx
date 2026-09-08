"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  AdminErrorNote,
  AdminHeading,
  AdminOkNote,
  adminFetch,
  adminInputClass,
  panelCard,
} from "@/components/admin/admin-ui";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const userId = params.id;
  const [item, setItem] = useState<UserDetail | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletNote, setWalletNote] = useState("");
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });

  const load = useCallback(async () => {
    const result = await adminFetch<{ item: UserDetail }>(`/api/admin?view=user&id=${encodeURIComponent(userId)}`);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItem(result.data.item);
    setEditForm({
      fullName: result.data.item.fullName,
      phone: result.data.item.phone,
      email: result.data.item.email ?? "",
      address: result.data.item.address ?? "",
    });
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

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setPending(true);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        action: "update-user",
        userId: item.id,
        fullName: editForm.fullName,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("اطلاعات کاربر ذخیره شد.");
    await load();
  }

  async function deleteUser() {
    if (!item) return;
    const confirmed = window.confirm(
      `حذف قطعی «${item.fullName}»؟ اگر سابقه درخواست/گفتگو/پرونده داشته باشد حذف انجام نمی‌شود.`,
    );
    if (!confirmed) return;
    const again = window.confirm("این عمل برگشت‌ناپذیر است. ادامه می‌دهید؟");
    if (!again) return;
    setPending(true);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "delete-user", userId: item.id }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/users");
  }

  if (!item && !error) {
    return <p className="text-sm text-navy/50">در حال بارگذاری…</p>;
  }
  if (!item) {
    return <AdminErrorNote>{error}</AdminErrorNote>;
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <Link href="/admin/users" className="inline-block text-sm text-gold-deep hover:underline">
        بازگشت به کاربران
      </Link>
      <AdminHeading
        kicker="جزئیات کاربر"
        title={item.fullName}
        description={`${toFaDigits(item.phone)}${item.email ? ` · ${item.email}` : ""}`}
      />

      <AdminErrorNote>{error}</AdminErrorNote>
      <AdminOkNote>{message}</AdminOkNote>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="وضعیت" value={item.active ? "فعال" : "غیرفعال"} />
        <Info label="کیف‌پول" value={formatTomanAmount(item.walletBalance)} />
        <Info label="عضویت" value={formatFaDateTime(item.createdAt)} />
        <Info label="آخرین ورود" value={item.lastLoginAt ? formatFaDateTime(item.lastLoginAt) : "—"} />
      </div>

      <div className="flex flex-wrap gap-2">
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
        <button
          type="button"
          disabled={pending}
          onClick={() => void deleteUser()}
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 disabled:opacity-60"
        >
          حذف کاربر
        </button>
        {item.openSupportTickets > 0 ? (
          <Link href="/admin/support" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {toFaDigits(item.openSupportTickets)} تیکت باز
          </Link>
        ) : null}
      </div>

      <form onSubmit={(e) => void saveProfile(e)} className={cn(panelCard, "grid gap-3 p-5 sm:grid-cols-2")}>
        <h2 className="sm:col-span-2 font-heading text-lg font-semibold">ویرایش اطلاعات</h2>
        <label className="block text-sm">
          <span className="text-navy/60">نام و نام خانوادگی</span>
          <input
            required
            minLength={3}
            value={editForm.fullName}
            onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
            className={adminInputClass()}
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">موبایل</span>
          <input
            required
            value={editForm.phone}
            onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
            className={adminInputClass()}
            dir="ltr"
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">ایمیل</span>
          <input
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
            className={adminInputClass()}
            dir="ltr"
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">آدرس</span>
          <input
            value={editForm.address}
            onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
            className={adminInputClass()}
            maxLength={160}
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-gold disabled:opacity-60"
          >
            ذخیره تغییرات
          </button>
        </div>
      </form>

      <form onSubmit={adjustWallet} className={cn(panelCard, "grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto]")}>
        <h2 className="sm:col-span-3 font-heading text-lg font-semibold">تعدیل کیف‌پول</h2>
        <input
          value={walletAmount}
          onChange={(e) => setWalletAmount(e.target.value)}
          placeholder="± مبلغ تومان"
          className={cn(adminInputClass(), "mt-0")}
          dir="ltr"
        />
        <input
          value={walletNote}
          onChange={(e) => setWalletNote(e.target.value)}
          placeholder="دلیل (اختیاری)"
          className={cn(adminInputClass(), "mt-0")}
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
    <div className={cn(panelCard, "px-4 py-3")}>
      <p className="text-xs text-navy/45">{label}</p>
      <p className="mt-1 text-sm font-medium text-navy">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-lg font-semibold text-navy">{title}</h2>
      <div className={cn(panelCard, "mt-3 divide-y divide-navy/8 overflow-hidden p-0")}>{children}</div>
    </section>
  );
}
