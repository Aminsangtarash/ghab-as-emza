"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClockIcon,
  FolderPlusIcon,
  LockIcon,
  PhoneIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  FieldLabel,
  OkNote,
  SectionCard,
  Tone,
  inputClass,
  panelFetch,
  textareaClass,
} from "@/components/lawyer/lawyer-ui";
import { buttonVariants } from "@/components/ui/button";
import { appointmentKinds, appointmentKindMeta } from "@/lib/appointment-model";
import { caseStageMeta, caseStages } from "@/lib/case-model";
import { caseStageMeta as consultStageMeta, timeSlotMeta, urgencyMeta } from "@/lib/consult";
import type { ClientConversation } from "@/lib/conversations";
import type { LawyerNoteItem } from "@/lib/lawyer-desk";
import { formatFaDateTime, formatToman, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type DeskDetail = {
  requestMessage: string;
  urgency: string;
  caseStage: string;
  service: string;
  city?: string;
  preferredSlot?: string;
  feeToman: number;
  paymentStatus: string;
  clientEmail?: string;
};

export function LawyerThreadTools({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<ClientConversation | null>(null);
  const [detail, setDetail] = useState<DeskDetail | null>(null);
  const [notes, setNotes] = useState<LawyerNoteItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [closeText, setCloseText] = useState("");

  const [appointment, setAppointment] = useState({
    kind: "phone" as (typeof appointmentKinds)[number],
    scheduledAt: "",
    minutes: "30",
    note: "",
  });

  const [caseForm, setCaseForm] = useState({
    title: "",
    summary: "",
    stage: "review" as (typeof caseStages)[number],
    authority: "",
    courtBranch: "",
    fileNumber: "",
    feeToman: "",
    nextActionAt: "",
    nextActionNote: "",
  });

  const load = useCallback(async () => {
    const [conversation, noteList] = await Promise.all([
      panelFetch<{ summary: ClientConversation; detail: DeskDetail }>("/api/desk", {
        method: "POST",
        body: JSON.stringify({ action: "get", conversationId }),
      }),
      panelFetch<{ items: LawyerNoteItem[] }>(`/api/lawyer/notes?conversationId=${conversationId}`),
    ]);
    if (!conversation.ok) {
      setError(conversation.error);
      return;
    }
    setSummary(conversation.data.summary);
    setDetail(conversation.data.detail);
    if (noteList.ok) setNotes(noteList.data.items);
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    setPending(true);
    setError(null);
    setOkMessage(null);
    const result = await fn();
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "انجام نشد.");
      return false;
    }
    setOkMessage(message);
    await load();
    router.refresh();
    return true;
  }

  async function addNote() {
    if (!noteText.trim()) return;
    const done = await run(
      () =>
        panelFetch("/api/lawyer/notes", {
          method: "POST",
          body: JSON.stringify({ body: noteText, conversationId }),
        }),
      "یادداشت خصوصی ثبت شد.",
    );
    if (done) setNoteText("");
  }

  async function removeNote(id: string) {
    await run(
      () => panelFetch(`/api/lawyer/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
      "یادداشت حذف شد.",
    );
  }

  async function scheduleAppointment() {
    if (!appointment.scheduledAt) {
      setError("زمان جلسه را انتخاب کنید.");
      return;
    }
    const done = await run(
      () =>
        panelFetch("/api/lawyer/appointments", {
          method: "POST",
          body: JSON.stringify({
            conversationId,
            kind: appointment.kind,
            scheduledAt: new Date(appointment.scheduledAt).toISOString(),
            minutes: Number(appointment.minutes) || 30,
            note: appointment.note,
          }),
        }),
      "نوبت ثبت شد و به موکل اطلاع داده شد.",
    );
    if (done) setAppointment((current) => ({ ...current, scheduledAt: "", note: "" }));
  }

  async function createCase() {
    const done = await run(
      () =>
        panelFetch<{ caseId?: string }>("/api/lawyer/cases", {
          method: "POST",
          body: JSON.stringify({
            conversationId,
            title: caseForm.title,
            summary: caseForm.summary,
            stage: caseForm.stage,
            authority: caseForm.authority,
            courtBranch: caseForm.courtBranch,
            fileNumber: caseForm.fileNumber,
            feeToman: Number(caseForm.feeToman) || 0,
            nextActionAt: caseForm.nextActionAt
              ? new Date(caseForm.nextActionAt).toISOString()
              : undefined,
            nextActionNote: caseForm.nextActionNote,
          }),
        }),
      "پیشنهاد تشکیل پرونده ثبت شد و در انتظار تأیید موکل است.",
    );
    if (done) {
      setCaseForm((current) => ({ ...current, title: "", summary: "", nextActionNote: "" }));
    }
  }

  async function closeThread() {
    await run(
      () =>
        panelFetch("/api/desk", {
          method: "POST",
          body: JSON.stringify({ action: "close", conversationId, summary: closeText }),
        }),
      "گفتگو بسته شد؛ موکل می‌تواند امتیاز بدهد.",
    );
    setCloseText("");
  }

  async function reopenThread() {
    await run(
      () =>
        panelFetch("/api/desk", {
          method: "POST",
          body: JSON.stringify({ action: "reopen", conversationId }),
        }),
      "گفتگو دوباره باز شد.",
    );
  }

  async function markPhoneDone() {
    await run(
      () =>
        panelFetch("/api/desk", {
          method: "POST",
          body: JSON.stringify({ action: "phone-done", conversationId }),
        }),
      "انجام تماس تلفنی ثبت شد.",
    );
  }

  if (!summary) {
    return <p className="text-sm text-navy/50">{error ?? "در حال بارگذاری جعبه‌ابزار…"}</p>;
  }

  const closed = Boolean(summary.closedAt);

  return (
    <div className="min-w-0 space-y-4">
      <SectionCard title="موکل و درخواست" hint="این اطلاعات فقط برای شما نمایش داده می‌شود.">
        <dl className="grid gap-2 text-sm">
          <InfoRow icon={<UserRoundIcon className="size-3.5" />} label="موکل" value={summary.clientName ?? "—"} />
          <InfoRow
            icon={<PhoneIcon className="size-3.5" />}
            label="شماره تماس"
            value={summary.clientPhone ? toFaDigits(summary.clientPhone) : "—"}
          />
          {detail?.clientEmail ? <InfoRow label="ایمیل" value={detail.clientEmail} /> : null}
          <InfoRow label="خدمت" value={detail?.service ?? "—"} />
          <InfoRow
            label="فوریت"
            value={urgencyMeta[(detail?.urgency ?? "normal") as "normal" | "soon" | "urgent"]?.title ?? "عادی"}
          />
          <InfoRow
            label="مرحله موضوع"
            value={consultStageMeta[(detail?.caseStage ?? "other") as keyof typeof consultStageMeta] ?? "—"}
          />
          {detail?.city ? <InfoRow label="شهر" value={detail.city} /> : null}
          {detail?.preferredSlot ? (
            <InfoRow
              label="بازه ترجیحی"
              value={timeSlotMeta[detail.preferredSlot as keyof typeof timeSlotMeta] ?? detail.preferredSlot}
            />
          ) : null}
          <InfoRow label="مبلغ" value={formatToman(detail?.feeToman ?? 0)} />
        </dl>

        {detail?.requestMessage ? (
          <details className="mt-3 rounded-2xl bg-paper/60 p-3">
            <summary className="cursor-pointer text-xs font-medium text-navy/60">متن کامل درخواست</summary>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-navy/75">{detail.requestMessage}</p>
          </details>
        ) : null}
      </SectionCard>

      {summary.channel === "phone" && !closed && !summary.phoneCallDone && (
        <SectionCard title="تماس تلفنی" hint="پس از انجام تماس، آن را ثبت کنید تا برای موکل هم مشخص شود.">
          <button
            type="button"
            disabled={pending}
            onClick={() => void markPhoneDone()}
            className={cn(buttonVariants(), "h-10 bg-navy px-5 text-white hover:bg-navy-mid")}
          >
            <PhoneIcon className="size-4" />
            تماس تلفنی انجام شد
          </button>
        </SectionCard>
      )}

      {!closed && (
        <SectionCard title="ثبت نوبت" hint="زمان جلسه در گفتگو برای موکل ثبت می‌شود.">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>نوع جلسه</FieldLabel>
              <select
                value={appointment.kind}
                onChange={(event) =>
                  setAppointment((current) => ({
                    ...current,
                    kind: event.target.value as (typeof appointmentKinds)[number],
                  }))
                }
                className={inputClass}
              >
                {appointmentKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {appointmentKindMeta[kind]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <FieldLabel>زمان</FieldLabel>
              <input
                type="datetime-local"
                value={appointment.scheduledAt}
                onChange={(event) =>
                  setAppointment((current) => ({ ...current, scheduledAt: event.target.value }))
                }
                className={inputClass}
              />
            </label>
            <label className="block">
              <FieldLabel>مدت (دقیقه)</FieldLabel>
              <input
                type="number"
                min={5}
                max={480}
                value={appointment.minutes}
                onChange={(event) =>
                  setAppointment((current) => ({ ...current, minutes: event.target.value }))
                }
                className={inputClass}
              />
            </label>
            <label className="block">
              <FieldLabel>توضیح (اختیاری)</FieldLabel>
              <input
                value={appointment.note}
                onChange={(event) => setAppointment((current) => ({ ...current, note: event.target.value }))}
                className={inputClass}
                maxLength={300}
                placeholder="مثلاً: تماس از خط دفتر"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => void scheduleAppointment()}
            className={cn(buttonVariants(), "mt-3 h-10 bg-gold px-5 text-navy-deep hover:bg-gold-bright")}
          >
            <CalendarClockIcon className="size-4" />
            ثبت نوبت
          </button>
        </SectionCard>
      )}

      <SectionCard
        title="پرونده"
        hint="اگر موضوع به کارشناسی و پیگیری بیشتر نیاز دارد، پیشنهاد تشکیل پرونده بدهید."
      >
        {summary.caseId ? (
          <div className="rounded-2xl border border-navy/8 bg-paper/60 p-4">
            <p className="text-sm text-navy/70">برای این درخواست پرونده تشکیل شده است.</p>
            <Link
              href={`/lawyer/cases/${summary.caseId}`}
              className={cn(buttonVariants({ variant: "outline" }), "mt-3 h-10 border-navy/15 px-4")}
            >
              مشاهده پرونده
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              <label className="block">
                <FieldLabel>عنوان پرونده</FieldLabel>
                <input
                  value={caseForm.title}
                  onChange={(event) => setCaseForm((current) => ({ ...current, title: event.target.value }))}
                  className={inputClass}
                  maxLength={160}
                  placeholder="مثلاً: مطالبه وجه چک و خسارت تأخیر"
                />
              </label>
              <label className="block">
                <FieldLabel>شرح و برنامه کار</FieldLabel>
                <textarea
                  value={caseForm.summary}
                  onChange={(event) => setCaseForm((current) => ({ ...current, summary: event.target.value }))}
                  className={textareaClass}
                  maxLength={4000}
                  placeholder="خلاصه موضوع، مدارک لازم و مراحل پیش‌رو را برای موکل بنویسید."
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <FieldLabel>مرحله</FieldLabel>
                  <select
                    value={caseForm.stage}
                    onChange={(event) =>
                      setCaseForm((current) => ({
                        ...current,
                        stage: event.target.value as (typeof caseStages)[number],
                      }))
                    }
                    className={inputClass}
                  >
                    {caseStages.map((stage) => (
                      <option key={stage} value={stage}>
                        {caseStageMeta[stage]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <FieldLabel>حق‌الوکاله پیشنهادی (تومان)</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    value={caseForm.feeToman}
                    onChange={(event) => setCaseForm((current) => ({ ...current, feeToman: event.target.value }))}
                    className={inputClass}
                    placeholder="0"
                  />
                </label>
                <label className="block">
                  <FieldLabel>مرجع رسیدگی (اختیاری)</FieldLabel>
                  <input
                    value={caseForm.authority}
                    onChange={(event) => setCaseForm((current) => ({ ...current, authority: event.target.value }))}
                    className={inputClass}
                    maxLength={120}
                    placeholder="مثلاً: دادگاه عمومی حقوقی تهران"
                  />
                </label>
                <label className="block">
                  <FieldLabel>شعبه (اختیاری)</FieldLabel>
                  <input
                    value={caseForm.courtBranch}
                    onChange={(event) => setCaseForm((current) => ({ ...current, courtBranch: event.target.value }))}
                    className={inputClass}
                    maxLength={120}
                  />
                </label>
                <label className="block">
                  <FieldLabel>اقدام بعدی (اختیاری)</FieldLabel>
                  <input
                    type="datetime-local"
                    value={caseForm.nextActionAt}
                    onChange={(event) => setCaseForm((current) => ({ ...current, nextActionAt: event.target.value }))}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <FieldLabel>عنوان اقدام بعدی</FieldLabel>
                  <input
                    value={caseForm.nextActionNote}
                    onChange={(event) =>
                      setCaseForm((current) => ({ ...current, nextActionNote: event.target.value }))
                    }
                    className={inputClass}
                    maxLength={300}
                    placeholder="مثلاً: تکمیل مدارک هویتی"
                  />
                </label>
              </div>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => void createCase()}
              className={cn(buttonVariants(), "mt-3 h-10 bg-navy px-5 text-white hover:bg-navy-mid")}
            >
              <FolderPlusIcon className="size-4" />
              ثبت پیشنهاد پرونده
            </button>
          </>
        )}
      </SectionCard>

      <SectionCard
        title="یادداشت خصوصی"
        hint="این یادداشت‌ها برای موکل نمایش داده نمی‌شود."
        action={<Tone tone="bg-navy/5 text-navy/55">فقط شما</Tone>}
      >
        <textarea
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          className={textareaClass}
          maxLength={4000}
          placeholder="نکات پرونده، ادله، پیگیری‌های لازم…"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => void addNote()}
          className={cn(buttonVariants({ variant: "outline" }), "mt-3 h-10 border-navy/15 px-4")}
        >
          <LockIcon className="size-4" />
          ثبت یادداشت
        </button>

        <div className="mt-4 space-y-2">
          {notes.length === 0 ? (
            <EmptyRow>یادداشتی ثبت نشده است.</EmptyRow>
          ) : (
            notes.map((item) => (
              <div key={item.id} className="rounded-2xl border border-navy/8 bg-paper/50 p-3">
                <p className="whitespace-pre-line text-sm leading-7 text-navy/75">{item.body}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-navy/40">{formatFaDateTime(item.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => void removeNote(item.id)}
                    className="flex items-center gap-1 text-[11px] text-red-700 hover:underline"
                  >
                    <Trash2Icon className="size-3" />
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={closed ? "گفتگوی بسته‌شده" : "بستن گفتگو"}
        hint={
          closed
            ? "تا زمانی که موکل امتیاز نداده باشد، می‌توانید گفتگو را دوباره باز کنید."
            : "با بستن گفتگو، ارسال پیام متوقف می‌شود و موکل می‌تواند امتیاز بدهد."
        }
      >
        {closed ? (
          <>
            {summary.closeSummary ? (
              <p className="whitespace-pre-line rounded-2xl bg-paper/60 p-3 text-sm leading-7 text-navy/75">
                {summary.closeSummary}
              </p>
            ) : null}
            <button
              type="button"
              disabled={pending || summary.hasRated}
              onClick={() => void reopenThread()}
              className={cn(buttonVariants({ variant: "outline" }), "mt-3 h-10 border-navy/15 px-4")}
            >
              باز کردن دوباره گفتگو
            </button>
            {summary.hasRated ? (
              <p className="mt-2 text-xs text-navy/45">
                موکل امتیاز {toFaDigits(summary.ratingScore ?? 0)} از ۵ را ثبت کرده است.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <FieldLabel>جمع‌بندی نهایی برای موکل</FieldLabel>
            <textarea
              value={closeText}
              onChange={(event) => setCloseText(event.target.value)}
              className={textareaClass}
              maxLength={4000}
              placeholder="نتیجه مشاوره، اقدام‌های پیشنهادی و مهلت‌ها را خلاصه بنویسید."
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (window.confirm("گفتگو بسته شود؟ پس از این، ارسال پیام متوقف می‌شود.")) {
                  void closeThread();
                }
              }}
              className={cn(buttonVariants(), "mt-3 h-10 bg-red-600 px-5 text-white hover:bg-red-700")}
            >
              بستن گفتگو
            </button>
          </>
        )}
      </SectionCard>

      <ErrorNote>{error}</ErrorNote>
      <OkNote>{okMessage}</OkNote>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-navy/6 pb-2 last:border-0 last:pb-0">
      <dt className="flex items-center gap-1.5 text-xs text-navy/45">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 truncate text-sm text-navy/80">{value}</dd>
    </div>
  );
}
