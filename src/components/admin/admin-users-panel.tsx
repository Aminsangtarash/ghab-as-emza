"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { adminFetch } from "@/components/admin/admin-ui";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";

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
  const [items, setItems] = useState<ClientUser[]>([]);
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
    <div>
      <p className="text-xs font-semibold tracking-wide text-gold-deep">دسترسی</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">کاربران</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">
        جستجو، فیلتر و مدیریت حساب کاربران. برای جزئیات، کیف‌پول و تاریخچه وارد صفحه کاربر شوید.
      </p>

      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="نام یا شماره"
          className="min-w-[12rem] flex-1 rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm"
        />
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as typeof active)}
          className="rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
        </select>
        <select
          value={wallet}
          onChange={(e) => setWallet(e.target.value as typeof wallet)}
          className="rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm"
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

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-navy/10 bg-white">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-sm text-navy/50">موردی نیست.</p>
        ) : (
          <ul className="divide-y divide-navy/8">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
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
                      className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs"
                    >
                      جزئیات
                    </Link>
                    <button
                      type="button"
                      disabled={pending === item.id}
                      onClick={() => void toggleActive(item.id, !item.active)}
                      className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs disabled:opacity-60"
                    >
                      {item.active ? "غیرفعال" : "فعال"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
