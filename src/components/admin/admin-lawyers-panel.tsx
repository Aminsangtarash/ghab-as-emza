"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { adminFetch } from "@/components/admin/admin-ui";
import { formatTomanAmount, toFaDigits } from "@/lib/format";

type LawyerRow = {
  id: string;
  slug: string;
  fullName: string;
  phone: string;
  active: boolean;
  acceptingNew: boolean;
  city?: string | null;
  specialty?: string | null;
  isCustom: boolean;
  openChats: number;
  acceptsToday: number;
  acceptsWeek: number;
  avgRating: number;
  ratingCount: number;
  rejectRate: number;
  earningsToman: number;
  lowQuality: boolean;
  overCapacity: boolean;
};

export function AdminLawyersPanel() {
  const [items, setItems] = useState<LawyerRow[]>([]);
  const [sort, setSort] = useState<"week" | "rating" | "earnings">("week");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    city: "",
    specialty: "",
    title: "",
  });

  const load = useCallback(async () => {
    const result = await adminFetch<{ items: LawyerRow[] }>("/api/admin?view=lawyers");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.data.items);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = [...items].sort((a, b) => {
    if (sort === "rating") return b.avgRating - a.avgRating || b.ratingCount - a.ratingCount;
    if (sort === "earnings") return b.earningsToman - a.earningsToman;
    return b.acceptsWeek - a.acceptsWeek;
  });

  async function createLawyer(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "create-lawyer", ...form }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("وکیل جدید ساخته شد.");
    setForm({ fullName: "", phone: "", password: "", city: "", specialty: "", title: "" });
    await load();
  }

  async function toggle(slug: string, active: boolean) {
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "set-lawyer-active", slug, active }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
  }

  async function toggleAccepting(slug: string, acceptingNew: boolean) {
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "set-lawyer-accepting", slug, acceptingNew }),
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
      <p className="text-xs font-semibold tracking-wide text-gold-deep">تیم حقوقی</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">وکلا</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">
        عملکرد، ظرفیت پذیرش، امتیاز و درآمد تقریبی هر وکیل. برای جزئیات کامل وارد پروفایل شوید.
      </p>

      <form onSubmit={createLawyer} className="mt-8 grid gap-3 rounded-xl border border-navy/10 bg-white p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 font-heading text-lg font-semibold text-navy">افزودن وکیل</h2>
        {(
          [
            ["fullName", "نام کامل"],
            ["phone", "موبایل"],
            ["password", "رمز عبور"],
            ["city", "شهر"],
            ["specialty", "تخصص"],
            ["title", "عنوان (اختیاری)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="text-navy/60">{label}</span>
            <input
              required={key !== "title"}
              type={key === "password" ? "password" : "text"}
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
              dir={key === "phone" || key === "password" ? "ltr" : undefined}
            />
          </label>
        ))}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-gold disabled:opacity-60"
          >
            ثبت وکیل
          </button>
        </div>
      </form>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["week", "رتبه هفته"],
            ["rating", "رتبه امتیاز"],
            ["earnings", "رتبه درآمد"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSort(id)}
            className={`rounded-xl px-3 py-1.5 text-xs ${
              sort === id ? "bg-navy text-gold" : "border border-navy/15 bg-white text-navy/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {sorted.map((item, index) => (
          <li key={item.id} className="rounded-xl border border-navy/10 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] text-navy/40">رتبه {toFaDigits(index + 1)}</p>
                <Link href={`/admin/lawyers/${item.slug}`} className="font-heading text-base font-semibold text-navy hover:text-gold-deep">
                  {item.fullName}
                  {item.isCustom ? <span className="ms-2 text-[11px] text-gold-deep">(جدید)</span> : null}
                </Link>
                <p className="mt-1 text-xs text-navy/50">
                  {item.specialty ?? "—"} · {item.city ?? "—"} · <span dir="ltr">{toFaDigits(item.phone)}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <Badge>امروز: {toFaDigits(item.acceptsToday)}</Badge>
                  <Badge>هفته: {toFaDigits(item.acceptsWeek)}</Badge>
                  <Badge>گفتگوی باز: {toFaDigits(item.openChats)}</Badge>
                  <Badge>
                    امتیاز: {item.ratingCount ? toFaDigits(Number(item.avgRating.toFixed(1))) : "—"}
                  </Badge>
                  <Badge>رد: {toFaDigits(item.rejectRate)}٪</Badge>
                  <Badge>درآمد: {formatTomanAmount(item.earningsToman)}</Badge>
                  {item.lowQuality ? <Badge tone="danger">هشدار کیفیت</Badge> : null}
                  {item.overCapacity ? <Badge tone="warn">ظرفیت بالا</Badge> : null}
                  {!item.acceptingNew ? <Badge tone="warn">بسته به پذیرش</Badge> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/lawyers/${item.slug}`} className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs">
                  جزئیات
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void toggleAccepting(item.slug, !item.acceptingNew)}
                  className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs disabled:opacity-60"
                >
                  {item.acceptingNew ? "توقف پذیرش" : "شروع پذیرش"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void toggle(item.slug, !item.active)}
                  className="rounded-xl border border-navy/15 px-3 py-1.5 text-xs disabled:opacity-60"
                >
                  {item.active ? "غیرفعال" : "فعال"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warn" | "danger";
}) {
  const cls =
    tone === "danger"
      ? "bg-red-50 text-red-700"
      : tone === "warn"
        ? "bg-amber-50 text-amber-800"
        : "bg-navy/5 text-navy/65";
  return <span className={`rounded-full px-2.5 py-1 ${cls}`}>{children}</span>;
}
