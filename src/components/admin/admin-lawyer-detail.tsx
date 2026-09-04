"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { adminFetch } from "@/components/admin/admin-ui";
import { formatFaDateTime, formatTomanAmount, toFaDigits } from "@/lib/format";

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
  const slug = params.slug;
  const [item, setItem] = useState<LawyerDetail | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const result = await adminFetch<{ item: LawyerDetail }>(
      `/api/admin?view=lawyer&slug=${encodeURIComponent(slug)}`,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItem(result.data.item);
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

  if (!item && !error) return <p className="text-sm text-navy/50">در حال بارگذاری…</p>;
  if (!item) return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;

  return (
    <div>
      <Link href="/admin/lawyers" className="text-sm text-gold-deep hover:underline">
        بازگشت به وکلا
      </Link>
      <p className="mt-4 text-xs font-semibold tracking-wide text-gold-deep">پروفایل وکیل</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">{item.fullName}</h1>
      <p className="mt-2 text-sm text-navy/60">
        {item.title ?? "وکیل"} · {item.specialty ?? "—"} · {item.city ?? "—"}
      </p>
      <p className="mt-1 text-xs text-navy/45" dir="ltr">
        {toFaDigits(item.phone)}
      </p>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="حساب" value={item.active ? "فعال" : "غیرفعال"} />
        <Info label="پذیرش جدید" value={item.acceptingNew ? "باز" : "بسته"} />
        <Info
          label="امتیاز"
          value={item.ratingCount ? toFaDigits(Number(item.avgRating.toFixed(1))) : "—"}
        />
        <Info label="گفتگوی باز" value={toFaDigits(item.openConversations.length)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
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
      </div>

      {item.bio ? (
        <p className="mt-8 rounded-xl border border-navy/10 bg-white px-4 py-4 text-sm leading-7 text-navy/70">
          {item.bio}
        </p>
      ) : null}

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
