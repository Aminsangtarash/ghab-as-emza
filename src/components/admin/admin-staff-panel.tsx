"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/components/admin/admin-ui";
import { toFaDigits } from "@/lib/format";

type StaffRow = {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  active: boolean;
  isPrimary: boolean;
};

export function AdminStaffPanel() {
  const [items, setItems] = useState<StaffRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    role: "admin" as "admin" | "manager",
  });

  const load = useCallback(async () => {
    const result = await adminFetch<{ items: StaffRow[] }>("/api/admin?view=staff");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.data.items);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "create-staff", ...form }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("حساب کارکنان ساخته شد.");
    setForm({ fullName: "", phone: "", password: "", role: "admin" });
    await load();
  }

  async function resetPassword(userId: string) {
    const password = window.prompt("رمز جدید (حداقل ۶ کاراکتر):");
    if (!password) return;
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "reset-staff-password", userId, password }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("رمز به‌روز شد.");
  }

  async function toggle(userId: string, active: boolean) {
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "set-staff-active", userId, active }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-gold-deep">فقط مدیر</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">کارکنان</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">
        ساخت ادمین یا مدیر جدید، بازنشانی رمز و فعال/غیرفعال‌سازی. مدیر اول قابل غیرفعال‌سازی نیست.
      </p>

      <form onSubmit={onCreate} className="mt-8 grid gap-3 rounded-xl border border-navy/10 bg-white p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 font-heading text-lg font-semibold">افزودن کارکنان</h2>
        <label className="block text-sm">
          <span className="text-navy/60">نام</span>
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">موبایل</span>
          <input
            required
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
            dir="ltr"
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">رمز</span>
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
            dir="ltr"
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">نقش</span>
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as "admin" | "manager" }))}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
          >
            <option value="admin">ادمین</option>
            <option value="manager">مدیر</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-gold disabled:opacity-60"
          >
            ایجاد
          </button>
        </div>
      </form>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

      <ul className="mt-8 divide-y divide-navy/8 overflow-hidden rounded-xl border border-navy/10 bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">
                {item.fullName}{" "}
                {item.isPrimary ? <span className="text-[11px] text-gold-deep">(مدیر اول)</span> : null}
              </p>
              <p className="mt-1 text-xs text-navy/45">
                {item.role === "manager" ? "مدیر" : "ادمین"} · <span dir="ltr">{toFaDigits(item.phone)}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => void resetPassword(item.id)}
                className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs"
              >
                رمز جدید
              </button>
              {!item.isPrimary ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void toggle(item.id, !item.active)}
                  className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs"
                >
                  {item.active ? "غیرفعال" : "فعال"}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
