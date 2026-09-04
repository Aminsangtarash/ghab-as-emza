"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { adminFetch } from "@/components/admin/admin-ui";
import { formatFaDateTime, toFaDigits } from "@/lib/format";

type Item = {
  id: string;
  status: "pending" | "approved" | "rejected";
  fullName: string;
  phone: string;
  email: string | null;
  city: string;
  specialty: string;
  licenseNumber: string | null;
  experienceYears: number;
  bio: string | null;
  message: string;
  staffNote: string | null;
  lawyerSlug: string | null;
  createdAt: string;
};

const statusLabel = {
  pending: "در انتظار بررسی",
  approved: "تأییدشده",
  rejected: "ردشده",
} as const;

export function AdminCooperatePanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selected, setSelected] = useState<Item | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [approvedCreds, setApprovedCreds] = useState<{ phone: string; password: string; slug: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    const qs = filter === "all" ? "" : `&status=${filter}`;
    const result = await adminFetch<{ items: Item[] }>(`/api/admin?view=cooperate${qs}`);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.data.items);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setNote(selected?.staffNote ?? "");
    setApprovedCreds(null);
  }, [selected]);

  async function approve() {
    if (!selected) return;
    setPending(true);
    setError("");
    setMessage("");
    const result = await adminFetch<{
      ok: true;
      phone: string;
      password: string;
      slug: string;
      fullName: string;
    }>("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "approve-cooperate", id: selected.id, staffNote: note }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setApprovedCreds({
      phone: result.data.phone,
      password: result.data.password,
      slug: result.data.slug,
    });
    setMessage(`حساب وکیل برای ${result.data.fullName} ساخته شد.`);
    setSelected(null);
    await load();
  }

  async function reject() {
    if (!selected) return;
    setPending(true);
    setError("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "reject-cooperate", id: selected.id, staffNote: note }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("درخواست رد شد.");
    setSelected(null);
    await load();
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-gold-deep">جذب وکیل</p>
      <h1 className="mt-3 font-heading text-2xl font-bold text-navy">درخواست‌های همکاری</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">
        درخواست‌های ارسال‌شده از صفحه عمومی همکاری. با تأیید، حساب میز وکیل به‌صورت خودکار ساخته می‌شود.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["pending", "در انتظار"],
            ["all", "همه"],
            ["approved", "تأییدشده"],
            ["rejected", "ردشده"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-xl px-3 py-1.5 text-xs ${
              filter === id ? "bg-navy text-gold" : "border border-navy/15 bg-white text-navy/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
      {approvedCreds ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">اطلاعات ورود وکیل تازه‌ساخته</p>
          <p className="mt-1" dir="ltr">
            موبایل/رمز: {toFaDigits(approvedCreds.phone)}
          </p>
          <p className="mt-1 text-xs">
            پروفایل:{" "}
            <Link href={`/admin/lawyers/${approvedCreds.slug}`} className="underline">
              {approvedCreds.slug}
            </Link>
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <ul className="divide-y divide-navy/8 overflow-hidden rounded-xl border border-navy/10 bg-white">
          {items.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-navy/50">درخواستی نیست.</li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-start text-sm transition hover:bg-navy/[0.03] ${
                    selected?.id === item.id ? "bg-navy/[0.04]" : ""
                  }`}
                >
                  <span className="font-medium text-navy">{item.fullName}</span>
                  <span className="text-xs text-navy/45">
                    {item.specialty} · {item.city} · {statusLabel[item.status]} · {formatFaDateTime(item.createdAt)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="rounded-xl border border-navy/10 bg-white p-5">
          {!selected ? (
            <p className="text-sm text-navy/50">یک درخواست را برای بررسی انتخاب کنید.</p>
          ) : (
            <div>
              <p className="text-xs text-gold-deep">{statusLabel[selected.status]}</p>
              <h2 className="mt-2 font-heading text-lg font-semibold text-navy">{selected.fullName}</h2>
              <p className="mt-2 text-xs text-navy/50" dir="ltr">
                {toFaDigits(selected.phone)}
                {selected.email ? ` · ${selected.email}` : ""}
              </p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-navy/45">تخصص</dt>
                  <dd>{selected.specialty}</dd>
                </div>
                <div>
                  <dt className="text-xs text-navy/45">شهر</dt>
                  <dd>{selected.city}</dd>
                </div>
                <div>
                  <dt className="text-xs text-navy/45">سابقه</dt>
                  <dd>{toFaDigits(selected.experienceYears)} سال</dd>
                </div>
                <div>
                  <dt className="text-xs text-navy/45">پروانه</dt>
                  <dd>{selected.licenseNumber || "—"}</dd>
                </div>
              </dl>
              {selected.bio ? (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-navy/70">{selected.bio}</p>
              ) : null}
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-navy/80">{selected.message}</p>

              {selected.lawyerSlug ? (
                <Link
                  href={`/admin/lawyers/${selected.lawyerSlug}`}
                  className="mt-4 inline-block text-sm text-gold-deep hover:underline"
                >
                  مشاهده حساب وکیل ساخته‌شده
                </Link>
              ) : null}

              {selected.status === "pending" ? (
                <>
                  <label className="mt-6 block text-sm">
                    <span className="text-navy/60">یادداشت مدیریت</span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void approve()}
                      className="rounded-xl bg-navy px-4 py-2 text-xs font-medium text-gold disabled:opacity-60"
                    >
                      تأیید و ساخت حساب وکیل
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void reject()}
                      className="rounded-xl border border-red-200 px-4 py-2 text-xs text-red-700 disabled:opacity-60"
                    >
                      رد درخواست
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
