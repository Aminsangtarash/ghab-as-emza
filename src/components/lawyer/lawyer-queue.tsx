"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import {
  CheckIcon,
  ChevronLeftIcon,
  FileTextIcon,
  MapPinIcon,
  PhoneIcon,
  XIcon,
} from "lucide-react";

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { caseStageMeta, consultChannelMeta, timeSlotMeta, urgencyMeta } from "@/lib/consult";
import type { LawyerQueueItem } from "@/lib/conversations";
import {
  formatFaDateTime,
  formatFaRelative,
  formatFileSize,
  formatToman,
  toFaDigits,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type QueueMode = "accept" | "reject";

function urgencyTone(urgency: string) {
  if (urgency === "urgent") return "bg-red-50 text-red-700";
  if (urgency === "soon") return "bg-amber-50 text-amber-800";
  return "bg-navy/5 text-navy/55";
}

function urgencyLabel(urgency: string) {
  return urgencyMeta[urgency as keyof typeof urgencyMeta]?.title ?? "عادی";
}

function assignmentLabel(item: LawyerQueueItem) {
  if (item.assignedToMe) return "انتخاب مستقیم شما";
  if (item.isUrgent) return "پخش برای همه وکلا";
  return "معرفی توسط اپراتور";
}

export function LawyerQueue() {
  const router = useRouter();
  const [items, setItems] = useState<LawyerQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [mode, setMode] = useState<QueueMode | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const result = await panelFetch<{ items: LawyerQueueItem[] }>("/api/lawyer/queue");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setItems(result.data.items);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  const selected = useMemo(
    () => items?.find((item) => item.trackingCode === selectedCode) ?? null,
    [items, selectedCode],
  );

  const dialogItem = useMemo(
    () => (mode && selectedCode ? (items?.find((item) => item.trackingCode === selectedCode) ?? null) : null),
    [items, mode, selectedCode],
  );

  function openDetail(code: string) {
    setSelectedCode(code);
    setMode(null);
    setNote("");
    setError(null);
  }

  function openAction(code: string, next: QueueMode) {
    setSelectedCode(code);
    setMode(next);
    setNote("");
    setError(null);
  }

  function closeAction() {
    setMode(null);
    setNote("");
  }

  function closeDetail(open: boolean) {
    if (open) return;
    if (mode) return;
    setSelectedCode(null);
  }

  async function submit(trackingCode: string, action: QueueMode) {
    setPending(true);
    setError(null);
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
    setMode(null);
    setNote("");
    setSelectedCode(null);
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
        description="شرح موضوع و مدارک را ببینید، سپس بپذیرید یا رد کنید. با پذیرش گفتگو باز می‌شود؛ با رد، مبلغ به کیف پول موکل برمی‌گردد."
        actions={
          items && items.length > 0 ? (
            <p className="rounded-full bg-navy/5 px-3 py-1.5 text-xs font-medium text-navy/60">
              {toFaDigits(items.length)} درخواست در صف
            </p>
          ) : null
        }
      />

      <ErrorNote>{error && !mode ? error : null}</ErrorNote>

      {items === null ? (
        <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div className={cn(panelCard, "p-6")}>
          <EmptyRow>درخواستی در انتظار پذیرش شما نیست.</EmptyRow>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.trackingCode}>
              <QueueCard
                item={item}
                active={selectedCode === item.trackingCode && !mode}
                onOpen={() => openDetail(item.trackingCode)}
                onAccept={() => openAction(item.trackingCode, "accept")}
                onReject={() => openAction(item.trackingCode, "reject")}
              />
            </li>
          ))}
        </ul>
      )}

      <Sheet open={Boolean(selected) && !mode} onOpenChange={closeDetail}>
        <SheetContent
          side="right"
          showCloseButton
          className="w-full gap-0 border-navy/10 bg-white p-0 text-navy sm:max-w-lg"
        >
          {selected ? (
            <>
              <SheetHeader className="border-b border-navy/8 px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-center gap-2 pe-8">
                  <Tone tone={urgencyTone(selected.urgency)}>{urgencyLabel(selected.urgency)}</Tone>
                  {selected.sameCity ? (
                    <Tone tone="bg-emerald-50 text-emerald-800">هم‌شهر</Tone>
                  ) : null}
                  <Tone
                    tone={selected.assignedToMe ? "bg-gold/15 text-gold-deep" : "bg-sky-50 text-sky-800"}
                  >
                    {assignmentLabel(selected)}
                  </Tone>
                </div>
                <SheetTitle className="mt-3 font-heading text-xl font-bold text-navy">
                  {selected.subject}
                </SheetTitle>
                <SheetDescription className="mt-1.5 text-sm leading-6 text-navy/55">
                  {selected.serviceTitle} · {consultChannelMeta[selected.channel].title}
                  {selected.city ? ` · ${selected.city}` : ""}
                </SheetDescription>
                <p className="mt-1 text-xs text-navy/40">
                  {toFaDigits(selected.trackingCode)} · {formatFaDateTime(selected.createdAt)}
                </p>
              </SheetHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                {selected.acceptBlockedByCity ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm leading-6 text-amber-900">
                    فعلاً اولویت پذیرش با وکلای هم‌شهر موکل است. چند دقیقه دیگر می‌توانید بپذیرید.
                  </p>
                ) : null}

                <div>
                  <p className="text-xs font-medium text-navy/45">شرح موضوع</p>
                  <p className="mt-2 whitespace-pre-line rounded-2xl bg-paper/70 p-4 text-sm leading-7 text-navy/80">
                    {selected.message}
                  </p>
                </div>

                <dl className="grid gap-2.5 sm:grid-cols-2">
                  <MetaRow
                    label="موکل"
                    value={`${selected.clientName} — ${toFaDigits(selected.clientPhone)}`}
                    icon={<PhoneIcon className="size-3.5 text-navy/35" />}
                  />
                  <MetaRow
                    label="مرحله موضوع"
                    value={
                      caseStageMeta[selected.caseStage as keyof typeof caseStageMeta] ??
                      selected.caseStage
                    }
                  />
                  <MetaRow label="شهر" value={selected.city ?? "ثبت نشده"} />
                  <MetaRow
                    label="بازه زمانی ترجیحی"
                    value={
                      selected.preferredSlot
                        ? (timeSlotMeta[selected.preferredSlot as keyof typeof timeSlotMeta] ??
                          selected.preferredSlot)
                        : "ندارد"
                    }
                  />
                  <MetaRow label="مبلغ خدمت" value={formatToman(selected.feeToman)} />
                  <MetaRow
                    label="وضعیت پرداخت"
                    value={
                      selected.paymentStatus === "stub-paid"
                        ? "پرداخت‌شده"
                        : selected.paymentStatus === "free"
                          ? "رایگان"
                          : selected.paymentStatus
                    }
                  />
                </dl>

                {selected.documents.length > 0 ? (
                  <div className="rounded-2xl border border-navy/8 bg-paper/40 p-4">
                    <p className="text-xs font-medium text-navy/50">
                      مدارک پیوست ({toFaDigits(selected.documents.length)})
                    </p>
                    <ul className="mt-2.5 space-y-2">
                      {selected.documents.map((doc) => (
                        <li key={doc.id}>
                          <a
                            href={`/api/consultations/${encodeURIComponent(selected.trackingCode)}/documents/${doc.id}`}
                            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm text-navy transition hover:text-gold-deep"
                          >
                            <FileTextIcon className="size-4 shrink-0 text-navy/40" />
                            <span className="min-w-0 flex-1 truncate">{doc.originalName}</span>
                            <span className="shrink-0 text-xs text-navy/40">
                              {formatFileSize(doc.size)}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <SheetFooter className="border-t border-navy/8 bg-white px-5 py-4 sm:px-6">
                <div className="flex w-full flex-col gap-2 sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={selected.acceptBlockedByCity}
                    title={
                      selected.acceptBlockedByCity
                        ? "فعلاً اولویت با وکلای هم‌شهر است"
                        : undefined
                    }
                    onClick={() => openAction(selected.trackingCode, "accept")}
                    className={cn(
                      buttonVariants(),
                      "h-11 flex-1 bg-navy px-5 text-white hover:bg-navy-mid disabled:opacity-40",
                    )}
                  >
                    <CheckIcon className="size-4" />
                    پذیرش
                  </button>
                  <button
                    type="button"
                    onClick={() => openAction(selected.trackingCode, "reject")}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-11 flex-1 border-navy/15 px-5 text-navy",
                    )}
                  >
                    <XIcon className="size-4" />
                    رد کردن
                  </button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ActionDialog
        open={Boolean(mode && dialogItem)}
        mode={mode}
        item={dialogItem}
        note={note}
        pending={pending}
        error={error}
        onNoteChange={setNote}
        onClose={closeAction}
        onSubmit={() => {
          if (dialogItem && mode) void submit(dialogItem.trackingCode, mode);
        }}
      />
    </div>
  );
}

function QueueCard({
  item,
  active,
  onOpen,
  onAccept,
  onReject,
}: {
  item: LawyerQueueItem;
  active: boolean;
  onOpen: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <article
      className={cn(
        panelCard,
        "relative overflow-hidden transition",
        active ? "border-gold/50 shadow-md ring-1 ring-gold/20" : "hover:border-navy/20",
        item.isUrgent && "bg-gradient-to-l from-red-50/40 to-white",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 start-0 w-1",
          item.urgency === "urgent" || item.isUrgent
            ? "bg-red-500"
            : item.urgency === "soon"
              ? "bg-amber-400"
              : "bg-navy/15",
        )}
      />

      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Tone tone={urgencyTone(item.urgency)}>{urgencyLabel(item.urgency)}</Tone>
              {item.sameCity ? <Tone tone="bg-emerald-50 text-emerald-800">هم‌شهر</Tone> : null}
              {item.assignedToMe ? (
                <Tone tone="bg-gold/15 text-gold-deep">انتخاب شما</Tone>
              ) : null}
              {item.acceptBlockedByCity ? (
                <Tone tone="bg-amber-50 text-amber-800">اولویت هم‌شهر</Tone>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onOpen}
              className="mt-2.5 block w-full text-start"
            >
              <h2 className="font-heading text-base font-semibold text-navy transition hover:text-gold-deep sm:text-lg">
                {item.subject}
              </h2>
            </button>

            <p className="mt-1.5 text-sm text-navy/60">
              {item.clientName}
              <span className="text-navy/30"> · </span>
              {item.serviceTitle}
              <span className="text-navy/30"> · </span>
              {consultChannelMeta[item.channel].title}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy/45">
              {item.city ? (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-3.5" />
                  {item.city}
                </span>
              ) : null}
              <span>{formatToman(item.feeToman)}</span>
              <span>{formatFaRelative(item.createdAt)}</span>
              {item.documents.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <FileTextIcon className="size-3.5" />
                  {toFaDigits(item.documents.length)} مدرک
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 shrink-0 gap-1 px-2.5 text-navy/55 hover:text-navy",
            )}
          >
            جزئیات
            <ChevronLeftIcon className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-navy/8 pt-4">
          <button
            type="button"
            disabled={item.acceptBlockedByCity}
            title={
              item.acceptBlockedByCity ? "فعلاً اولویت با وکلای هم‌شهر است" : undefined
            }
            onClick={onAccept}
            className={cn(
              buttonVariants(),
              "h-10 bg-navy px-4 text-white hover:bg-navy-mid disabled:opacity-40",
            )}
          >
            <CheckIcon className="size-4" />
            پذیرش
          </button>
          <button
            type="button"
            onClick={onReject}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 border-navy/15 px-4 text-navy",
            )}
          >
            رد
          </button>
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "ms-auto h-10 px-3 text-navy/55 hover:text-navy",
            )}
          >
            بررسی کامل
          </button>
        </div>
      </div>
    </article>
  );
}

function ActionDialog({
  open,
  mode,
  item,
  note,
  pending,
  error,
  onNoteChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: QueueMode | null;
  item: LawyerQueueItem | null;
  note: string;
  pending: boolean;
  error: string | null;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const isAccept = mode === "accept";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-navy-deep/55 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Popup className="relative my-auto w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-navy/10 outline-none transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-6">
            <p className="text-sm font-medium text-gold-deep">
              {isAccept ? "پذیرش درخواست" : "رد درخواست"}
            </p>
            <Dialog.Title className="mt-1 font-heading text-xl font-bold text-navy">
              {item?.subject ?? "درخواست"}
            </Dialog.Title>
            <span
              className={cn(
                "mt-3 block h-1 w-12 rounded-full",
                isAccept ? "bg-gold" : "bg-red-400",
              )}
            />
            <Dialog.Description className="mt-3 text-sm leading-7 text-navy/65">
              {isAccept
                ? "با تأیید، گفتگو با موکل باز می‌شود. می‌توانید پیام نخست را همین‌جا بنویسید."
                : "با رد کردن، مبلغ به کیف پول موکل برمی‌گردد. ذکر دلیل اختیاری است."}
            </Dialog.Description>

            {item ? (
              <p className="mt-3 rounded-xl bg-paper/70 px-3 py-2 text-xs text-navy/50">
                {item.clientName}
                <span className="text-navy/25"> · </span>
                {item.serviceTitle}
                <span className="text-navy/25"> · </span>
                {formatToman(item.feeToman)}
              </p>
            ) : null}

            {item?.acceptBlockedByCity && isAccept ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                فعلاً اولویت با وکلای هم‌شهر است؛ پذیرش ممکن نیست.
              </p>
            ) : null}

            <div className="mt-4">
              <FieldLabel>
                {isAccept ? "پیام نخست به موکل (اختیاری)" : "دلیل رد درخواست (اختیاری)"}
              </FieldLabel>
              <textarea
                value={note}
                onChange={(event) => onNoteChange(event.target.value)}
                className={textareaClass}
                maxLength={isAccept ? 4000 : 300}
                disabled={pending}
                placeholder={
                  isAccept
                    ? "مثلاً: پرونده را بررسی کردم؛ برای شروع این مدارک را بفرستید…"
                    : "مثلاً: موضوع خارج از تخصص من است."
                }
              />
            </div>

            <ErrorNote>{error}</ErrorNote>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pending}
                onClick={onClose}
                className={cn(buttonVariants({ variant: "ghost" }), "h-11 px-4 text-navy/60")}
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={pending || (isAccept && Boolean(item?.acceptBlockedByCity))}
                onClick={onSubmit}
                className={cn(
                  buttonVariants(),
                  "h-11 px-5 text-white",
                  isAccept ? "bg-navy hover:bg-navy-mid" : "bg-red-600 hover:bg-red-700",
                )}
              >
                {pending
                  ? "در حال ثبت…"
                  : isAccept
                    ? "پذیرش و باز کردن گفتگو"
                    : "رد درخواست"}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MetaRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-navy/8 bg-paper/40 px-3 py-2.5">
      <dt className="text-[11px] text-navy/45">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-sm text-navy/80">
        {icon}
        <span className="min-w-0 truncate">{value}</span>
      </dd>
    </div>
  );
}
