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
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  source: string;
  status: "new" | "in-progress" | "resolved";
  fullName: string;
  phone: string | null;
  email: string | null;
  subject: string;
  body: string;
  staffNote: string | null;
  createdAt: string;
};

const statusLabel = {
  new: "جدید",
  "in-progress": "در حال پیگیری",
  resolved: "حل‌شده",
} as const;

export function AdminSupportDesk() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"all" | "new" | "in-progress" | "resolved">("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const qs = filter === "all" ? "" : `&status=${filter}`;
    const result = await adminFetch<{ items: Ticket[] }>(`/api/admin?view=support${qs}`);
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
  }, [selected]);

  async function setStatus(status: Ticket["status"]) {
    if (!selected) return;
    setPending(true);
    setError("");
    const result = await adminFetch("/api/admin", {
      method: "POST",
      body: JSON.stringify({ action: "update-support", id: selected.id, status, staffNote: note }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("وضعیت تیکت به‌روز شد.");
    setSelected(null);
    await load();
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <AdminHeading
        kicker="میز پشتیبانی"
        title="پشتیبانی کاربران"
        description="پیام‌های فرم تماس و گزارش‌های مشکل کاربران اینجا پیگیری می‌شود؛ وضعیت را عوض کنید و یادداشت داخلی بگذارید."
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "همه"],
            ["new", "جدید"],
            ["in-progress", "در حال پیگیری"],
            ["resolved", "حل‌شده"],
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

      <AdminErrorNote>{error}</AdminErrorNote>
      <AdminOkNote>{message}</AdminOkNote>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ul className={cn(panelCard, "divide-y divide-navy/8 overflow-hidden p-0")}>
          {items.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-navy/50">تیکتی نیست.</li>
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
                  <span className="font-medium text-navy">{item.subject}</span>
                  <span className="text-xs text-navy/45">
                    {item.fullName}
                    {item.phone ? ` · ${toFaDigits(item.phone)}` : ""} · {statusLabel[item.status]} ·{" "}
                    {formatFaDateTime(item.createdAt)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className={cn(panelCard, "p-5")}>
          {!selected ? (
            <p className="text-sm text-navy/50">یک تیکت را برای جزئیات و اقدام انتخاب کنید.</p>
          ) : (
            <div>
              <p className="text-xs text-gold-deep">{statusLabel[selected.status]}</p>
              <h2 className="mt-2 font-heading text-lg font-semibold text-navy">{selected.subject}</h2>
              <p className="mt-2 text-xs text-navy/50">
                {selected.fullName}
                {selected.phone ? ` · ${toFaDigits(selected.phone)}` : ""}
                {selected.email ? ` · ${selected.email}` : ""}
              </p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-navy/75">{selected.body}</p>

              <label className="mt-6 block text-sm">
                <span className="text-navy/60">یادداشت داخلی</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className={adminInputClass()}
                  placeholder="جمع‌بندی پیگیری، اقدام انجام‌شده…"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void setStatus("in-progress")}
                  className="rounded-xl border border-navy/15 px-3 py-2 text-xs disabled:opacity-60"
                >
                  در حال پیگیری
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void setStatus("resolved")}
                  className="rounded-xl bg-navy px-3 py-2 text-xs font-medium text-gold disabled:opacity-60"
                >
                  حل‌شده
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void setStatus("new")}
                  className="rounded-xl border border-navy/15 px-3 py-2 text-xs disabled:opacity-60"
                >
                  بازگشت به جدید
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
