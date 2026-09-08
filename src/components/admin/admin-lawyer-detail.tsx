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

type LawyerDetail = {
  id: string;
  slug: string;
  fullName: string;
  phone: string;
  active: boolean;
  acceptingNew: boolean;
  city?: string | null;
  specialty?: string | null;
  title?: string | null;
  bio?: string | null;
  experience?: string | null;
  years?: number | null;
  isCustom: boolean;
  createdAt: string;
  lastLoginAt?: string;
  avgRating: number;
  ratingCount: number;
  notesCount: number;
  openConversations: Array<{
    id: string;
    clientName: string;
    subject: string;
    trackingCode: string;
    createdAt: string;
  }>;
  recentConsults: Array<{
    trackingCode: string;
    subject: string;
    statusLabel: string;
    feeToman: number;
    createdAt: string;
  }>;
  ratings: Array<{
    score: number;
    comment?: string | null;
    clientName: string;
    createdAt: string;
  }>;
  appointments: Array<{
    id: string;
    kind: string;
    status: string;
    clientName: string;
    scheduledAt: string;
  }>;
};

export function AdminLawyerDetailPanel() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const [item, setItem] = useState<LawyerDetail | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    city: "",
    specialty: "",
    title: "",
    bio: "",
    experience: "",
    years: "",
    acceptingNew: true,
  });

  const load = useCallback(async () => {
    const result = await adminFetch<{ item: LawyerDetail }>(
      `/api/admin?view=lawyer&slug=${encodeURIComponent(slug)}`,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const next = result.data.item;
    setItem(next);
    setEditForm({
      fullName: next.fullName,
      phone: next.phone,
      city: next.city ?? "",
      specialty: next.specialty ?? "",
      title: next.title ?? "",
      bio: next.bio ?? "",
      experience: next.experience ?? "",
      years: next.years != null ? String(next.years) : "",
      acceptingNew: next.acceptingNew,
    });
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive() {
    if (!item) return;
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "set-lawyer-active", slug: item.slug, active: !item.active }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("وضعیت حساب به‌روز شد.");
    await load();
  }

  async function toggleAccepting() {
    if (!item) return;
    setPending(true);
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({
        action: "set-lawyer-accepting",
        slug: item.slug,
        acceptingNew: !item.acceptingNew,
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("وضعیت پذیرش به‌روز شد.");
    await load();
  }

  async function resetPassword() {
    if (!item) return;
    const password = window.prompt("رمز جدید وکیل (حداقل ۶ کاراکتر):");
    if (!password) return;
    setPending(true);
    setError("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "reset-lawyer-password", slug: item.slug, password }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("رمز وکیل بازنشانی شد.");
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
        action: "update-lawyer",
        slug: item.slug,
        fullName: editForm.fullName,
        phone: editForm.phone,
        city: editForm.city,
        specialty: editForm.specialty,
        title: editForm.title,
        bio: editForm.bio,
        experience: editForm.experience,
        years: editForm.years,
        acceptingNew: editForm.acceptingNew,
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("اطلاعات وکیل ذخیره شد.");
    await load();
  }

  async function deleteLawyer() {
    if (!item) return;
    const confirmed = window.confirm(
      `حذف قطعی «${item.fullName}»؟ اگر سابقه درخواست/گفتگو/پرونده/نوبت داشته باشد حذف انجام نمی‌شود.`,
    );
    if (!confirmed) return;
    const again = window.confirm("این عمل برگشت‌ناپذیر است. ادامه می‌دهید؟");
    if (!again) return;
    setPending(true);
    setError("");
    setMessage("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "delete-lawyer", slug: item.slug }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/lawyers");
  }

  if (!item && !error) return <p className="text-sm text-navy/50">در حال بارگذاری…</p>;
  if (!item) return <AdminErrorNote>{error}</AdminErrorNote>;

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <Link href="/admin/lawyers" className="inline-block text-sm text-gold-deep hover:underline">
        بازگشت به وکلا
      </Link>
      <AdminHeading
        kicker="پروفایل وکیل"
        title={item.fullName}
        description={`${item.title ?? "وکیل"} · ${item.specialty ?? "—"} · ${item.city ?? "—"} · ${toFaDigits(item.phone)}`}
      />

      <AdminErrorNote>{error}</AdminErrorNote>
      <AdminOkNote>{message}</AdminOkNote>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="حساب" value={item.active ? "فعال" : "غیرفعال"} />
        <Info label="پذیرش جدید" value={item.acceptingNew ? "باز" : "بسته"} />
        <Info
          label="امتیاز"
          value={item.ratingCount ? toFaDigits(Number(item.avgRating.toFixed(1))) : "—"}
        />
        <Info label="گفتگوی باز" value={toFaDigits(item.openConversations.length)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void toggleAccepting()}
          className="rounded-xl border border-navy/15 px-3 py-2 text-xs disabled:opacity-60"
        >
          {item.acceptingNew ? "توقف پذیرش" : "شروع پذیرش"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void toggleActive()}
          className="rounded-xl border border-navy/15 px-3 py-2 text-xs disabled:opacity-60"
        >
          {item.active ? "غیرفعال کردن حساب" : "فعال کردن حساب"}
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
          onClick={() => void deleteLawyer()}
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 disabled:opacity-60"
        >
          حذف وکیل
        </button>
      </div>

      <form onSubmit={(e) => void saveProfile(e)} className={cn(panelCard, "grid gap-3 p-5 sm:grid-cols-2")}>
        <h2 className="sm:col-span-2 font-heading text-lg font-semibold">ویرایش اطلاعات</h2>
        <label className="block text-sm">
          <span className="text-navy/60">نام</span>
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
          <span className="text-navy/60">عنوان</span>
          <input
            value={editForm.title}
            onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
            className={adminInputClass()}
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">تخصص</span>
          <input
            required
            value={editForm.specialty}
            onChange={(e) => setEditForm((p) => ({ ...p, specialty: e.target.value }))}
            className={adminInputClass()}
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">شهر</span>
          <input
            required
            value={editForm.city}
            onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
            className={adminInputClass()}
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">سابقه (متن)</span>
          <input
            value={editForm.experience}
            onChange={(e) => setEditForm((p) => ({ ...p, experience: e.target.value }))}
            className={adminInputClass()}
            placeholder="مثلاً ۱۲ سال"
          />
        </label>
        <label className="block text-sm">
          <span className="text-navy/60">سال سابقه (عدد)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={editForm.years}
            onChange={(e) => setEditForm((p) => ({ ...p, years: e.target.value }))}
            className={adminInputClass()}
            dir="ltr"
          />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={editForm.acceptingNew}
            onChange={(e) => setEditForm((p) => ({ ...p, acceptingNew: e.target.checked }))}
          />
          <span className="text-navy/70">پذیرش درخواست جدید</span>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-navy/60">بیو</span>
          <textarea
            value={editForm.bio}
            onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
            className={cn(adminInputClass(), "min-h-28")}
            maxLength={1500}
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

      <Section title="گفتگوهای باز">
        {item.openConversations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-navy/50">موردی نیست.</p>
        ) : (
          item.openConversations.map((c) => (
            <div key={c.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{c.subject}</p>
              <p className="text-xs text-navy/45">
                {c.clientName} · {toFaDigits(c.trackingCode)} · {formatFaDateTime(c.createdAt)}
              </p>
            </div>
          ))
        )}
      </Section>

      <Section title="آخرین درخواست‌ها">
        {item.recentConsults.length === 0 ? (
          <p className="px-4 py-6 text-sm text-navy/50">موردی نیست.</p>
        ) : (
          item.recentConsults.map((c) => (
            <Link
              key={c.trackingCode}
              href={`/admin/requests/${c.trackingCode}`}
              className="block px-4 py-3 text-sm hover:bg-navy/[0.03]"
            >
              <p className="font-medium">{c.subject}</p>
              <p className="text-xs text-navy/45">
                {c.statusLabel} · {formatTomanAmount(c.feeToman)} · {formatFaDateTime(c.createdAt)}
              </p>
            </Link>
          ))
        )}
      </Section>

      <Section title="نظرات">
        {item.ratings.length === 0 ? (
          <p className="px-4 py-6 text-sm text-navy/50">نظری نیست.</p>
        ) : (
          item.ratings.map((r, i) => (
            <div key={`${r.createdAt}-${i}`} className="px-4 py-3 text-sm">
              <p className="font-medium">
                {toFaDigits(r.score)} از ۵ · {r.clientName}
              </p>
              {r.comment ? <p className="mt-1 text-navy/70">{r.comment}</p> : null}
              <p className="mt-1 text-xs text-navy/40">{formatFaDateTime(r.createdAt)}</p>
            </div>
          ))
        )}
      </Section>

      <Section title="نوبت‌ها">
        {item.appointments.length === 0 ? (
          <p className="px-4 py-6 text-sm text-navy/50">نوبتی نیست.</p>
        ) : (
          item.appointments.map((a) => (
            <div key={a.id} className="px-4 py-3 text-sm">
              <p className="font-medium">
                {a.clientName} · {a.kind}
              </p>
              <p className="text-xs text-navy/45">
                {a.status} · {formatFaDateTime(a.scheduledAt)}
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
