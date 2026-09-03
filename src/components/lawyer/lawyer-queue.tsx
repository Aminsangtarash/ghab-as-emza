"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileTextIcon, PhoneIcon } from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  FieldLabel,
  LawyerHeading,
  Tone,
  panelCard,
  panelFetch,
  textareaClass,
} from "@/components/lawyer/lawyer-ui";
import { buttonVariants } from "@/components/ui/button";
import { caseStageMeta, consultChannelMeta, timeSlotMeta, urgencyMeta } from "@/lib/consult";
import type { LawyerQueueItem } from "@/lib/conversations";
import { formatFaDateTime, formatFileSize, formatToman, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LawyerQueue() {
  const router = useRouter();
  const [items, setItems] = useState<LawyerQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [mode, setMode] = useState<"accept" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const result = await panelFetch<{ items: LawyerQueueItem[] }>("/api/lawyer/queue");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.data.items);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(timer);
  }, [load]);

  function openForm(code: string, next: "accept" | "reject") {
    setOpenCode(code);
    setMode(next);
    setNote("");
    setError(null);
  }

  async function submit(trackingCode: string, action: "accept" | "reject") {
    setPending(true);
    const result = await panelFetch<{ conversationId?: string }>("/api/lawyer/queue", {
      method: "POST",
      body: JSON.stringify(
        action === "accept"
          ? { action, trackingCode, firstMessage: note }
          : { action, trackingCode, reason: note },
      ),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpenCode(null);
    setMode(null);
    setNote("");
    if (action === "accept" && result.data.conversationId) {
      router.push(`/lawyer/chats/${result.data.conversationId}`);
      return;
    }
    await load();
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker="صف کار"
        title="درخواست‌های جدید"
        description="پیش از پذیرش، شرح موضوع و مدارک را ببینید. با پذیرش، گفتگو باز می‌شود و با رد کردن، مبلغ به کیف پول موکل برمی‌گردد."
      />

      <ErrorNote>{error}</ErrorNote>

      {items === null ? (
        <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div className={cn(panelCard, "px-6 py-10")}>
          <EmptyRow>درخواستی در انتظار پذیرش شما نیست.</EmptyRow>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const open = openCode === item.trackingCode;
            return (
              <li key={item.trackingCode} className={cn(panelCard, "px-5 py-5 sm:px-6")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-semibold text-navy">{item.subject}</h2>
                    <p className="mt-1 text-sm text-navy/55">
                      {item.serviceTitle} · {consultChannelMeta[item.channel].title}
                    </p>
                    <p className="mt-1 text-xs text-navy/40">
                      {toFaDigits(item.trackingCode)} · {formatFaDateTime(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Tone tone={item.urgency === "urgent" ? "bg-red-50 text-red-700" : item.urgency === "soon" ? "bg-amber-50 text-amber-800" : "bg-navy/5 text-navy/55"}>
                      {urgencyMeta[item.urgency as "normal" | "soon" | "urgent"]?.title ?? "عادی"}
                    </Tone>
                    <Tone tone={item.assignedToMe ? "bg-gold/15 text-gold-deep" : "bg-sky-50 text-sky-800"}>
                      {item.assignedToMe ? "انتخاب مستقیم شما" : "معرفی توسط اپراتور"}
                    </Tone>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line rounded-2xl bg-paper/60 p-4 text-sm leading-7 text-navy/75">
                  {item.message}
                </p>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <Row label="موکل" value={`${item.clientName} — ${toFaDigits(item.clientPhone)}`} icon={<PhoneIcon className="size-3.5 text-navy/35" />} />
                  <Row label="مرحله موضوع" value={caseStageMeta[item.caseStage as keyof typeof caseStageMeta] ?? item.caseStage} />
                  <Row label="شهر" value={item.city ?? "ثبت نشده"} />
                  <Row
                    label="بازه زمانی ترجیحی"
                    value={item.preferredSlot ? timeSlotMeta[item.preferredSlot as keyof typeof timeSlotMeta] ?? item.preferredSlot : "ندارد"}
                  />
                  <Row label="مبلغ خدمت" value={formatToman(item.feeToman)} />
                  <Row label="وضعیت پرداخت" value={item.paymentStatus === "stub-paid" ? "پرداخت‌شده" : item.paymentStatus === "free" ? "رایگان" : item.paymentStatus} />
                </dl>

                {item.documents.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-navy/8 bg-white p-4">
                    <p className="text-xs font-medium text-navy/50">مدارک پیوست</p>
                    <ul className="mt-2 space-y-2">
                      {item.documents.map((doc) => (
                        <li key={doc.id}>
                          <a
                            href={`/api/consultations/${encodeURIComponent(item.trackingCode)}/documents/${doc.id}`}
                            className="flex items-center gap-2 text-sm text-navy hover:text-gold-deep"
                          >
                            <FileTextIcon className="size-4 text-navy/40" />
                            <span className="min-w-0 truncate">{doc.originalName}</span>
                            <span className="shrink-0 text-xs text-navy/40">{formatFileSize(doc.size)}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {open ? (
                  <div className="mt-4 rounded-2xl border border-navy/10 bg-paper/60 p-4">
                    <FieldLabel>
                      {mode === "accept" ? "پیام نخست به موکل (اختیاری)" : "دلیل رد درخواست (اختیاری)"}
                    </FieldLabel>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className={textareaClass}
                      maxLength={mode === "accept" ? 4000 : 300}
                      placeholder={
                        mode === "accept"
                          ? "مثلاً: پرونده را بررسی کردم؛ برای شروع این مدارک را بفرستید…"
                          : "مثلاً: موضوع خارج از تخصص من است."
                      }
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void submit(item.trackingCode, mode ?? "accept")}
                        className={cn(
                          buttonVariants(),
                          "h-10 px-5",
                          mode === "accept"
                            ? "bg-navy text-white hover:bg-navy-mid"
                            : "bg-red-600 text-white hover:bg-red-700",
                        )}
                      >
                        {mode === "accept" ? "پذیرش و باز کردن گفتگو" : "رد درخواست"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setOpenCode(null);
                          setMode(null);
                        }}
                        className={cn(buttonVariants({ variant: "ghost" }), "h-10 px-4 text-navy/60")}
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openForm(item.trackingCode, "accept")}
                      className={cn(buttonVariants(), "h-10 bg-navy px-5 text-white hover:bg-navy-mid")}
                    >
                      پذیرش
                    </button>
                    <button
                      type="button"
                      onClick={() => openForm(item.trackingCode, "reject")}
                      className={cn(buttonVariants({ variant: "outline" }), "h-10 border-navy/15 px-5")}
                    >
                      رد کردن
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-navy/8 bg-white px-3 py-2.5">
      <dt className="text-[11px] text-navy/45">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-sm text-navy/80">
        {icon}
        <span className="min-w-0 truncate">{value}</span>
      </dd>
    </div>
  );
}
