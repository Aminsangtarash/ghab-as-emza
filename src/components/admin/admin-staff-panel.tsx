"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AdminErrorNote,
  AdminHeading,
  AdminOkNote,
  adminFetch,
  adminInputClass,
  panelCard,
} from "@/components/admin/admin-ui";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type StaffRow = {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  active: boolean;
  isPrimary: boolean;
};

type EditState = {
  id: string;
  fullName: string;
  phone: string;
  role: "admin" | "manager";
};

export function AdminStaffPanel() {
  const [items, setItems] = useState<StaffRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
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

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setPending(true);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        action: "update-staff",
        userId: editing.id,
        fullName: editing.fullName,
        phone: editing.phone,
        role: editing.role,
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("اطلاعات کارکنان ذخیره شد.");
    setEditing(null);
    await load();
  }

  async function deleteStaff(item: StaffRow) {
    const confirmed = window.confirm(`حذف قطعی «${item.fullName}»؟`);
    if (!confirmed) return;
    const again = window.confirm("این عمل برگشت‌ناپذیر است. ادامه می‌دهید؟");
    if (!again) return;
    setPending(true);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "delete-staff", userId: item.id }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("حساب کارکنان حذف شد.");
    if (editing?.id === item.id) setEditing(null);
    await load();
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <AdminHeading
        kicker="فقط مدیر"
        title="کارکنان"
        description="ساخت، ویرایش، حذف، بازنشانی رمز و فعال/غیرفعال‌سازی. مدیر اول قابل ویرایش یا حذف نیست."
      />

      <form onSubmit={onCreate} className={cn(panelCard, "grid gap-3 p-5 sm:grid-cols-2")}>
        <h2 className="sm:col-span-2 font-heading text-lg font-semibold">افزودن کارکنان</h2>
        <label className="block text-sm">
          <span className="text-navy/60">نام</span>
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            className={adminInputClass()}
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">موبایل</span>
          <input
            required
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className={adminInputClass()}
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
            className={adminInputClass()}
            dir="ltr"
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">نقش</span>
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as "admin" | "manager" }))}
            className={adminInputClass()}
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

      <AdminErrorNote>{error}</AdminErrorNote>
      <AdminOkNote>{message}</AdminOkNote>

      {editing ? (
        <form
          onSubmit={(e) => void saveEdit(e)}
          className="grid gap-3 rounded-[1.35rem] border border-gold/30 bg-amber-50/60 p-5 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 font-heading text-base font-semibold text-navy">
            ویرایش: {editing.fullName}
          </h2>
          <label className="block text-sm">
            <span className="text-navy/60">نام</span>
            <input
              required
              minLength={3}
              value={editing.fullName}
              onChange={(e) => setEditing((p) => (p ? { ...p, fullName: e.target.value } : p))}
              className={adminInputClass()}
            />
          </label>
          <label className="block text-sm">
            <span className="text-navy/60">موبایل</span>
            <input
              required
              value={editing.phone}
              onChange={(e) => setEditing((p) => (p ? { ...p, phone: e.target.value } : p))}
              className={adminInputClass()}
              dir="ltr"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-navy/60">نقش</span>
            <select
              value={editing.role}
              onChange={(e) =>
                setEditing((p) => (p ? { ...p, role: e.target.value as "admin" | "manager" } : p))
              }
              className={cn(adminInputClass(), "sm:max-w-xs")}
            >
              <option value="admin">ادمین</option>
              <option value="manager">مدیر</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-gold disabled:opacity-60"
            >
              ذخیره
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(null)}
              className="rounded-xl border border-navy/15 bg-white px-4 py-2 text-sm"
            >
              انصراف
            </button>
          </div>
        </form>
      ) : null}

      <ul className={cn(panelCard, "divide-y divide-navy/8 overflow-hidden p-0")}>
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">
                {item.fullName}{" "}
                {item.isPrimary ? <span className="text-[11px] text-gold-deep">(مدیر اول)</span> : null}
              </p>
              <p className="mt-1 text-xs text-navy/45">
                {item.role === "manager" ? "مدیر" : "ادمین"} ·{" "}
                <span dir="ltr">{toFaDigits(item.phone)}</span>
                {!item.active ? " · غیرفعال" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!item.isPrimary ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    setEditing({
                      id: item.id,
                      fullName: item.fullName,
                      phone: item.phone,
                      role: item.role === "manager" ? "manager" : "admin",
                    })
                  }
                  className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs"
                >
                  ویرایش
                </button>
              ) : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => void resetPassword(item.id)}
                className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs"
              >
                رمز جدید
              </button>
              {!item.isPrimary ? (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void toggle(item.id, !item.active)}
                    className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs"
                  >
                    {item.active ? "غیرفعال" : "فعال"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void deleteStaff(item)}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800"
                  >
                    حذف
                  </button>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
