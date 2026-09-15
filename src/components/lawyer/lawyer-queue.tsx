"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { EmptyRow, ErrorNote, LawyerHeading, panelCard, panelFetch, textareaClass } from "@/components/lawyer/lawyer-ui";
import { buttonVariants } from "@/components/ui/button";
import { formatFaDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Assignment = {
  trackingCode: string;
  subject: string;
  message: string;
  serviceTitle: string;
  status: string;
  clientName: string;
  clientPhone: string;
  createdAt: string;
  conversationId?: string;
  pendingProposals: number;
};

const kinds = [
  { id: "result", label: "ثبت نتیجه / تغییر" },
  { id: "open-chat", label: "درخواست شروع گفتگو" },
  { id: "form-case", label: "پیشنهاد تشکیل پرونده" },
  { id: "new-work", label: "کار جدید" },
  { id: "document-request", label: "درخواست مدرک" },
  { id: "close", label: "پیشنهاد پایان کار" },
] as const;

export function LawyerQueue() {
  const [items, setItems] = useState<Assignment[] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [kind, setKind] = useState<(typeof kinds)[number]["id"]>("result");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const result = await panelFetch<{ items: Assignment[] }>("/api/lawyer/proposals");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.data.items);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (!selected) {
      setError("ابتدا یک کار منتسب را انتخاب کنید.");
      return;
    }
    setPending(true);
    setError("");
    setMessage("");
    const result = await panelFetch("/api/lawyer/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingCode: selected, kind, title, body }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("برای مدیر ارسال شد. تا تأیید ایشان برای موکل نمایش داده نمی‌شود.");
    setTitle("");
    setBody("");
    void load();
  }

  return (
    <div className="space-y-5">
      <LawyerHeading
        kicker="میز کار"
        title="کارهای منتسب"
        description="فقط پرونده‌هایی که مدیر به شما سپرده اینجا دیده می‌شود. حق رد ندارید؛ هر اقدام باید به تأیید مدیر برسد."
      />
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}

      <div className={cn(panelCard, "divide-y divide-navy/8")}>
        {!items ? (
          <p className="p-5 text-sm text-navy/50">در حال بارگذاری…</p>
        ) : items.length === 0 ? (
          <EmptyRow>هنوز کاری به شما منتسب نشده است.</EmptyRow>
        ) : (
          items.map((item) => (
            <button
              key={item.trackingCode}
              type="button"
              onClick={() => setSelected(item.trackingCode)}
              className={cn(
                "flex w-full flex-col gap-1 px-5 py-4 text-start",
                selected === item.trackingCode ? "bg-navy/[0.04]" : "hover:bg-navy/[0.02]",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-navy">{item.subject}</p>
                <span className="text-xs text-navy/45">{item.serviceTitle}</span>
              </div>
              <p className="text-sm text-navy/60">
                {item.clientName} · {item.clientPhone}
              </p>
              <p className="line-clamp-2 text-sm leading-6 text-navy/55">{item.message}</p>
              <p className="text-xs text-navy/40">
                {formatFaDateTime(item.createdAt)}
                {item.pendingProposals > 0 ? ` · ${item.pendingProposals} مورد در انتظار تأیید مدیر` : ""}
              </p>
              {item.conversationId ? (
                <Link
                  href={`/lawyer/chats/${item.conversationId}`}
                  className="text-xs text-gold-deep hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  گفتگوی تأییدشده
                </Link>
              ) : (
                <span className="text-xs text-navy/40">گفتگو هنوز توسط مدیر باز نشده است</span>
              )}
            </button>
          ))
        )}
      </div>

      <div className={cn(panelCard, "space-y-3 p-5")}>
        <h2 className="font-heading text-base font-semibold text-navy">ارسال برای تأیید مدیر</h2>
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as typeof kind)}
          className="h-11 w-full rounded-xl border border-navy/15 px-3 text-sm"
        >
          {kinds.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="عنوان"
          className="h-11 w-full rounded-xl border border-navy/15 px-3 text-sm"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="شرح نتیجه، تغییر یا اقدام پیشنهادی"
          className={textareaClass}
          rows={5}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => void submit()}
          className={cn(buttonVariants(), "bg-navy text-white hover:bg-navy-mid")}
        >
          {pending ? "در حال ارسال…" : "ارسال به مدیر"}
        </button>
      </div>
    </div>
  );
}
