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

type ClientUser = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  walletBalance: number;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
  consultations: number;
  conversations: number;
  cases: number;
};

export function AdminUsersPanel() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [wallet, setWallet] = useState<"all" | "positive">("all");
  const [openRequest, setOpenRequest] = useState(false);
  const [items, setItems] = useState<ClientUser[] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ view: "users" });
    if (q.trim()) params.set("q", q.trim());
    if (active !== "all") params.set("active", active);
    if (wallet === "positive") params.set("wallet", "positive");
    if (openRequest) params.set("openRequest", "1");
    const result = await adminFetch<{ items: ClientUser[] }>(`/api/admin?${params}`);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.data.items);
  }, [q, active, wallet, openRequest]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive(userId: string, next: boolean) {
    setPending(userId);
    setError("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "set-user-active", userId, active: next }),
    });
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(next ? "حساب فعال شد." : "حساب غیرفعال شد.");
    await load();
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <AdminHeading
        kicker="دسترسی"
        title="کاربران"
        description="جستجو، فیلتر و مدیریت حساب کاربران. برای جزئیات، کیف‌پول و تاریخچه وارد صفحه کاربر شوید."
      />

      <form
        className={cn(panelCard, "flex flex-wrap gap-2 px-4 py-3")}
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="نام یا شماره"
          className={cn(adminInputClass(), "mt-0 min-w-[12rem] flex-1")}
        />
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as typeof active)}
          className={cn(adminInputClass(), "mt-0 w-auto")}
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
        </select>
        <select
          value={wallet}
          onChange={(e) => setWallet(e.target.value as typeof wallet)}
          className={cn(adminInputClass(), "mt-0 w-auto")}
        >
          <option value="all">همه موجودی‌ها</option>
          <option value="positive">موجودی &gt; ۰</option>
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm">
          <input type="checkbox" checked={openRequest} onChange={(e) => setOpenRequest(e.target.checked)} />
          درخواست باز
        </label>
        <button type="submit" className="rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-gold">
          اعمال
        </button>
      </form>

      <AdminErrorNote>{error}</AdminErrorNote>
      <AdminOkNote>{message}</AdminOkNote>

      {items === null ? (
        <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <AdminEmptyRow>موردی نیست.</AdminEmptyRow>
      ) : (
        <div className={cn(panelCard, "overflow-hidden p-0")}>
          <ul className="divide-y divide-navy/8">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/users/${item.id}`} className="font-medium text-navy hover:text-gold-deep">
                      {item.fullName}
                    </Link>
                    <p className="mt-1 text-xs text-navy/50" dir="ltr">
                      {toFaDigits(item.phone)}
                    </p>
                    <p className="mt-2 text-xs text-navy/45">
                      کیف‌پول: {formatTomanAmount(item.walletBalance)} · درخواست: {toFaDigits(item.consultations)} ·
                      گفتگو: {toFaDigits(item.conversations)} · پرونده: {toFaDigits(item.cases)}
                      {item.lastLoginAt ? ` · ورود: ${formatFaDateTime(item.lastLoginAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/users/${item.id}`}
                      className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs transition hover:border-gold/40"
                    >
                      جزئیات
                    </Link>
                    <button
                      type="button"
                      disabled={pending === item.id}
                      onClick={() => void toggleActive(item.id, !item.active)}
                      className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs transition hover:border-gold/40 disabled:opacity-60"
                    >
                      {item.active ? "غیرفعال" : "فعال"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
