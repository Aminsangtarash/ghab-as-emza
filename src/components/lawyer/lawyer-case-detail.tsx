"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClockIcon, CheckIcon, EyeIcon, LockIcon, PlusIcon, Trash2Icon } from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  FieldError,
  FieldLabel,
  LawyerHeading,
  OkNote,
  SectionCard,
  Tone,
  controlClass,
  inputClass,
  panelCard,
  panelFetch,
  textareaClass,
} from "@/components/lawyer/lawyer-ui";
import { ConsultDocumentList } from "@/components/consult/document-list";
import { DocumentPreviewModal } from "@/components/consult/document-preview-modal";
import { buttonVariants } from "@/components/ui/button";
import { JalaliDateTimeField } from "@/components/ui/jalali-datetime-field";
import { SiteSelect } from "@/components/ui/site-select";
import { appointmentKindMeta, appointmentKinds } from "@/lib/appointment-model";
import { suggestNextAppointmentLocalValue } from "@/lib/appointment-slot";
import {
  caseEventKindMeta,
  caseEventKinds,
  caseStageMeta,
  caseStages,
  caseStatusMeta,
  caseStatuses,
  type CaseEventKind,
  type CaseStage,
  type CaseStatus,
  type ClientCase,
} from "@/lib/case-model";
import { formatFaDateTime, formatTomanAmount, toEnDigits, toFaDigits } from "@/lib/format";
import type { LawyerNoteItem } from "@/lib/lawyer-desk";
import { cn } from "@/lib/utils";

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function LawyerCaseDetail({ caseId }: { caseId: string }) {
  const [item, setItem] = useState<ClientCase | null>(null);
  const [notes, setNotes] = useState<LawyerNoteItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [form, setForm] = useState({
    status: "active" as CaseStatus,
    stage: "review" as CaseStage,
    authority: "",
    courtBranch: "",
    fileNumber: "",
    feeToman: "0",
    paidToman: "0",
    nextActionAt: "",
    nextActionNote: "",
    closeNote: "",
  });

  const [event, setEvent] = useState({
    kind: "note" as CaseEventKind,
    title: "",
    body: "",
    happensAt: "",
    visibleToClient: true,
  });
  const [eventErrors, setEventErrors] = useState<Record<string, string>>({});
  const [appointmentErrors, setAppointmentErrors] = useState<Record<string, string>>({});
  const [noteError, setNoteError] = useState<string | null>(null);

  const [noteText, setNoteText] = useState("");
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    documentId: string;
    title: string;
    mimeType?: string;
  } | null>(null);
  const [appointment, setAppointment] = useState({
    kind: "in-person" as (typeof appointmentKinds)[number],
    scheduledAt: "",
    minutes: "45",
    note: "",
  });

  const load = useCallback(async () => {
    const [result, appointments] = await Promise.all([
      panelFetch<{ item: ClientCase; notes: LawyerNoteItem[] }>(`/api/lawyer/cases/${caseId}`),
      panelFetch<{ items: Array<{ scheduledAt: string }> }>("/api/lawyer/appointments"),
    ]);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const next = result.data.item;
    setItem(next);
    setNotes(result.data.notes ?? []);
    setForm({
      status: next.status,
      stage: next.stage,
      authority: next.authority ?? "",
      courtBranch: next.courtBranch ?? "",
      fileNumber: next.fileNumber ?? "",
      feeToman: String(next.feeToman),
      paidToman: String(next.paidToman),
      nextActionAt: toLocalInput(next.nextActionAt),
      nextActionNote: next.nextActionNote ?? "",
      closeNote: next.closeNote ?? "",
    });
    if (appointments.ok) {
      setAppointment((current) =>
        current.scheduledAt
          ? current
          : {
              ...current,
              scheduledAt: suggestNextAppointmentLocalValue(appointments.data.items),
            },
      );
    }
  }, [caseId]);

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
    return true;
  }

  async function saveCase() {
    await run(
      () =>
        panelFetch(`/api/lawyer/cases/${caseId}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: form.status,
            stage: form.stage,
            authority: form.authority,
            courtBranch: form.courtBranch,
            fileNumber: form.fileNumber,
            feeToman: Number(toEnDigits(form.feeToman)) || 0,
            paidToman: Number(toEnDigits(form.paidToman)) || 0,
            nextActionAt: form.nextActionAt ? new Date(form.nextActionAt).toISOString() : null,
            nextActionNote: form.nextActionNote,
            closeNote: form.closeNote,
          }),
        }),
      "پرونده به‌روزرسانی شد.",
    );
  }

  async function addEvent() {
    const nextErrors: Record<string, string> = {};
    if (event.title.trim().length < 3) nextErrors.title = "عنوان رویداد را کامل‌تر بنویسید.";
    setEventErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("لطفاً فیلدهای مشخص‌شده را تکمیل کنید.");
      return;
    }
    const done = await run(
      () =>
        panelFetch(`/api/lawyer/cases/${caseId}/events`, {
          method: "POST",
          body: JSON.stringify({
            kind: event.kind,
            title: event.title,
            body: event.body,
            happensAt: event.happensAt ? new Date(event.happensAt).toISOString() : undefined,
            visibleToClient: event.visibleToClient,
          }),
        }),
      "رویداد در تایم‌لاین ثبت شد.",
    );
    if (done) {
      setEventErrors({});
      setEvent((current) => ({ ...current, title: "", body: "", happensAt: "" }));
    }
  }

  async function addNote() {
    if (!noteText.trim()) {
      setNoteError("متن یادداشت را بنویسید.");
      return;
    }
    setNoteError(null);
    const done = await run(
      () =>
        panelFetch("/api/lawyer/notes", {
          method: "POST",
          body: JSON.stringify({ body: noteText, caseId }),
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

  async function reviewDocItem(itemId: string, action: "approve" | "reject") {
    const result = await panelFetch(`/api/lawyer/document-requests/${itemId}/review`, {
      method: "POST",
      body: JSON.stringify({
        action,
        reason: action === "reject" ? "لطفاً فایل واضح‌تر یا مرتبط‌تری بارگذاری کنید." : undefined,
      }),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOkMessage(action === "approve" ? "مدرک تأیید شد." : "مدرک رد شد.");
    await load();
  }

  async function removeDocument(documentId: string) {
    if (!item?.trackingCode) return;
    setDeletingDocId(documentId);
    const result = await panelFetch(
      `/api/consultations/${encodeURIComponent(item.trackingCode)}/documents/${documentId}`,
      { method: "DELETE" },
    );
    setDeletingDocId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOkMessage("فایل از مدارک پرونده حذف شد.");
    await load();
  }

  async function scheduleAppointment() {
    const nextErrors: Record<string, string> = {};
    if (!appointment.scheduledAt) nextErrors.scheduledAt = "زمان جلسه را انتخاب کنید.";
    const minutes = Number(appointment.minutes);
    if (!Number.isFinite(minutes) || minutes < 5) nextErrors.minutes = "مدت جلسه را وارد کنید.";
    setAppointmentErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("لطفاً فیلدهای مشخص‌شده را تکمیل کنید.");
      return;
    }
    const done = await run(
      () =>
        panelFetch("/api/lawyer/appointments", {
          method: "POST",
          body: JSON.stringify({
            caseId,
            kind: appointment.kind,
            scheduledAt: new Date(appointment.scheduledAt).toISOString(),
            minutes: Number(appointment.minutes) || 45,
            note: appointment.note,
          }),
        }),
      "جلسه ثبت شد.",
    );
    if (done) {
      setAppointmentErrors({});
      const list = await panelFetch<{ items: Array<{ scheduledAt: string }> }>("/api/lawyer/appointments");
      setAppointment((current) => ({
        ...current,
        scheduledAt: suggestNextAppointmentLocalValue(
          list.ok ? list.data.items : [{ scheduledAt: new Date(current.scheduledAt).toISOString() }],
        ),
        note: "",
      }));
    }
  }

  if (!item) {
    return <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>{error ?? "در حال بارگذاری پرونده…"}</div>;
  }

  const locked = item.status === "proposed";

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker={`پرونده ${toFaDigits(item.caseNumber)}`}
        title={item.title}
        description={`${item.clientName}${item.clientPhone ? ` — ${toFaDigits(item.clientPhone)}` : ""} · ${caseStageMeta[item.stage]}`}
        actions={
          <>
            <Tone tone={caseStatusMeta[item.status].tone}>{caseStatusMeta[item.status].title}</Tone>
            <Link
              href="/lawyer/cases"
              className={cn(buttonVariants({ variant: "outline" }), "h-11 border-navy/15 px-4")}
            >
              فهرست پرونده‌ها
            </Link>
          </>
        }
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0 space-y-4">
          <SectionCard title="شرح و برنامه کار">
            <p className="whitespace-pre-line text-sm leading-7 text-navy/75">{item.summary}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Meta label="مرجع رسیدگی" value={item.authority ?? "ثبت نشده"} />
              <Meta label="شعبه" value={item.courtBranch ?? "ثبت نشده"} />
              <Meta label="شماره پرونده قضایی" value={item.fileNumber ? toFaDigits(item.fileNumber) : "ثبت نشده"} />
              <Meta label="حق‌الوکاله" value={formatTomanAmount(item.feeToman)} />
              <Meta label="دریافتی" value={formatTomanAmount(item.paidToman)} />
              <Meta
                label="اقدام بعدی"
                value={item.nextActionAt ? `${item.nextActionNote ?? "—"} · ${formatFaDateTime(item.nextActionAt)}` : "ثبت نشده"}
              />
            </dl>
            {item.trackingCode ? (
              <p className="mt-3 text-xs text-navy/45">
                برگرفته از درخواست {toFaDigits(item.trackingCode)}
              </p>
            ) : null}
            {item.clientNote ? (
              <p className="mt-3 rounded-2xl bg-paper/60 p-3 text-sm leading-7 text-navy/70">
                پاسخ موکل: {item.clientNote}
              </p>
            ) : null}
          </SectionCard>

          <SectionCard
            title="مدارک پرونده"
            hint="مدارک اولیه درخواست و موارد درخواستی از موکل با وضعیت تأیید."
          >
            {item.trackingCode && item.documents.length > 0 ? (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-navy/50">پیوست‌های اولیه درخواست</p>
                <ConsultDocumentList
                  trackingCode={item.trackingCode}
                  items={item.documents}
                  onDelete={(id) => void removeDocument(id)}
                  deletingId={deletingDocId}
                />
              </div>
            ) : null}

            {item.documentRequestItems.length > 0 ? (
              <ul className="space-y-2">
                {item.documentRequestItems.map((docItem) => (
                  <li key={docItem.id} className="rounded-xl border border-navy/8 bg-paper/50 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm text-navy">
                        {docItem.status === "approved" ? <CheckIcon className="size-4 text-emerald-600" /> : null}
                        {docItem.title}
                      </p>
                      <span className="text-[11px] text-navy/50">
                        {docItem.status === "pending"
                          ? "در انتظار آپلود"
                          : docItem.status === "uploaded"
                            ? "آپلود شده"
                            : docItem.status === "approved"
                              ? "تأیید شده"
                              : "رد شده"}
                      </span>
                    </div>
                    {docItem.documentId && item.trackingCode ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPreview({
                              documentId: docItem.documentId!,
                              title: docItem.title,
                              mimeType: docItem.documentMimeType,
                            })
                          }
                          className={cn(buttonVariants({ variant: "outline" }), "h-9 border-navy/15 px-3 text-xs")}
                        >
                          <EyeIcon className="size-3.5" />
                          مشاهده
                        </button>
                        {docItem.status !== "approved" ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => void reviewDocItem(docItem.id, "approve")}
                            className={cn(
                              buttonVariants(),
                              "h-9 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700",
                            )}
                          >
                            تأیید
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : item.documents.length === 0 ? (
              <EmptyRow>مدرکی برای این پرونده ثبت نشده است.</EmptyRow>
            ) : null}
          </SectionCard>

          {preview && item.trackingCode ? (
            <DocumentPreviewModal
              open
              onClose={() => setPreview(null)}
              trackingCode={item.trackingCode}
              documentId={preview.documentId}
              title={preview.title}
              mimeType={preview.mimeType}
            />
          ) : null}

          <SectionCard
            title="تایم‌لاین پرونده"
            hint="رویدادهای نامرئی برای موکل با برچسب «فقط شما» مشخص شده‌اند."
          >
            {item.events.length === 0 ? (
              <EmptyRow>رویدادی ثبت نشده است.</EmptyRow>
            ) : (
              <ol className="space-y-3">
                {item.events.map((row) => (
                  <li key={row.id} className="rounded-2xl border border-navy/8 bg-paper/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-navy">{row.title}</p>
                      <div className="flex items-center gap-2">
                        {row.visibleToClient ? null : <Tone tone="bg-navy/5 text-navy/55">فقط شما</Tone>}
                        <Tone tone={caseEventKindMeta[row.kind].tone}>{caseEventKindMeta[row.kind].title}</Tone>
                      </div>
                    </div>
                    {row.body ? (
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-navy/70">{row.body}</p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-navy/40">
                      {row.happensAt ? `زمان رویداد: ${formatFaDateTime(row.happensAt)} · ` : ""}
                      ثبت: {formatFaDateTime(row.createdAt)}
                      {row.authorRole === "client" ? " · توسط موکل" : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          <SectionCard title="ثبت رویداد جدید">
            <div className="grid gap-3">
              <label className="block">
                <FieldLabel>نوع</FieldLabel>
                <SiteSelect
                  value={event.kind}
                  onValueChange={(kind) => setEvent((c) => ({ ...c, kind: kind as CaseEventKind }))}
                  options={caseEventKinds.map((kind) => ({
                    value: kind,
                    label: caseEventKindMeta[kind].title,
                  }))}
                  className="h-11 w-full min-w-0"
                />
              </label>
              <div className="block">
                <FieldLabel>زمان رویداد (شمسی، اختیاری)</FieldLabel>
                <JalaliDateTimeField
                  value={event.happensAt}
                  onValueChange={(happensAt) => setEvent((c) => ({ ...c, happensAt }))}
                />
              </div>
            </div>
            <label className="mt-3 block">
              <FieldLabel required invalid={Boolean(eventErrors.title)}>
                عنوان
              </FieldLabel>
              <input
                value={event.title}
                onChange={(e) => {
                  setEvent((c) => ({ ...c, title: e.target.value }));
                  setEventErrors((current) => {
                    const { title: _t, ...rest } = current;
                    return rest;
                  });
                }}
                aria-invalid={Boolean(eventErrors.title)}
                className={controlClass(Boolean(eventErrors.title))}
                maxLength={160}
                placeholder="مثلاً: جلسه رسیدگی شعبه ۱۰۲"
              />
              <FieldError>{eventErrors.title}</FieldError>
            </label>
            <label className="mt-3 block">
              <FieldLabel>توضیح (اختیاری)</FieldLabel>
              <textarea
                value={event.body}
                onChange={(e) => setEvent((c) => ({ ...c, body: e.target.value }))}
                className={textareaClass}
                maxLength={4000}
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm text-navy/70">
              <input
                type="checkbox"
                checked={event.visibleToClient}
                onChange={(e) => setEvent((c) => ({ ...c, visibleToClient: e.target.checked }))}
                className="size-4 accent-[#c9a227]"
              />
              برای موکل هم نمایش داده شود
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={() => void addEvent()}
              className={cn(buttonVariants(), "mt-3 h-10 bg-navy px-5 text-white hover:bg-navy-mid")}
            >
              <PlusIcon className="size-4" />
              ثبت رویداد
            </button>
          </SectionCard>
        </div>

        <div className="min-w-0 space-y-4">
          <SectionCard
            title="وضعیت و اطلاعات پرونده"
            hint={locked ? "تا تأیید موکل، فقط اطلاعات پرونده قابل ویرایش است." : undefined}
          >
            <div className="grid gap-3">
              <label className="block">
                <FieldLabel>وضعیت</FieldLabel>
                <SiteSelect
                  value={form.status}
                  onValueChange={(status) => setForm((c) => ({ ...c, status: status as CaseStatus }))}
                  options={caseStatuses
                    .filter((status) => status !== "proposed" || locked)
                    .map((status) => ({
                      value: status,
                      label: caseStatusMeta[status].title,
                    }))}
                  className={cn("h-11 w-full min-w-0", locked && "pointer-events-none opacity-60")}
                />
              </label>
              <label className="block">
                <FieldLabel>مرحله</FieldLabel>
                <SiteSelect
                  value={form.stage}
                  onValueChange={(stage) => setForm((c) => ({ ...c, stage: stage as CaseStage }))}
                  options={caseStages.map((stage) => ({
                    value: stage,
                    label: caseStageMeta[stage],
                  }))}
                  className="h-11 w-full min-w-0"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <FieldLabel>مرجع رسیدگی</FieldLabel>
                  <input
                    value={form.authority}
                    onChange={(e) => setForm((c) => ({ ...c, authority: e.target.value }))}
                    className={inputClass}
                    maxLength={120}
                  />
                </label>
                <label className="block">
                  <FieldLabel>شعبه</FieldLabel>
                  <input
                    value={form.courtBranch}
                    onChange={(e) => setForm((c) => ({ ...c, courtBranch: e.target.value }))}
                    className={inputClass}
                    maxLength={120}
                  />
                </label>
                <label className="block">
                  <FieldLabel>شماره پرونده قضایی</FieldLabel>
                  <input
                    value={form.fileNumber}
                    onChange={(e) => setForm((c) => ({ ...c, fileNumber: e.target.value }))}
                    className={inputClass}
                    maxLength={60}
                  />
                </label>
                <label className="block">
                  <FieldLabel>حق‌الوکاله (تومان)</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    value={form.feeToman}
                    onChange={(e) => setForm((c) => ({ ...c, feeToman: e.target.value }))}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <FieldLabel>دریافتی (تومان)</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    value={form.paidToman}
                    onChange={(e) => setForm((c) => ({ ...c, paidToman: e.target.value }))}
                    className={inputClass}
                  />
                </label>
                <div className="block sm:col-span-2">
                  <FieldLabel>زمان اقدام بعدی (شمسی)</FieldLabel>
                  <JalaliDateTimeField
                    value={form.nextActionAt}
                    onValueChange={(nextActionAt) => setForm((c) => ({ ...c, nextActionAt }))}
                  />
                </div>
              </div>
              <label className="block">
                <FieldLabel>عنوان اقدام بعدی</FieldLabel>
                <input
                  value={form.nextActionNote}
                  onChange={(e) => setForm((c) => ({ ...c, nextActionNote: e.target.value }))}
                  className={inputClass}
                  maxLength={300}
                />
              </label>
              {form.status === "closed" ? (
                <label className="block">
                  <FieldLabel>جمع‌بندی نهایی پرونده</FieldLabel>
                  <textarea
                    value={form.closeNote}
                    onChange={(e) => setForm((c) => ({ ...c, closeNote: e.target.value }))}
                    className={textareaClass}
                    maxLength={4000}
                  />
                </label>
              ) : null}
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => void saveCase()}
              className={cn(buttonVariants(), "mt-3 h-10 bg-gold px-5 text-navy-deep hover:bg-gold-bright")}
            >
              ذخیره تغییرات
            </button>
          </SectionCard>

          <SectionCard title="ثبت جلسه" hint="جلسه در تایم‌لاین پرونده و نوبت‌های شما ثبت می‌شود.">
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <FieldLabel>نوع</FieldLabel>
                  <SiteSelect
                    value={appointment.kind}
                    onValueChange={(kind) =>
                      setAppointment((c) => ({ ...c, kind: kind as (typeof appointmentKinds)[number] }))
                    }
                    options={appointmentKinds.map((kind) => ({
                      value: kind,
                      label: appointmentKindMeta[kind],
                    }))}
                    className="h-11 w-full min-w-0"
                  />
                </label>
                <label className="block">
                  <FieldLabel required invalid={Boolean(appointmentErrors.minutes)}>
                    مدت (دقیقه)
                  </FieldLabel>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={appointment.minutes}
                    onChange={(e) => {
                      setAppointment((c) => ({ ...c, minutes: e.target.value }));
                      setAppointmentErrors((current) => {
                        const { minutes: _m, ...rest } = current;
                        return rest;
                      });
                    }}
                    aria-invalid={Boolean(appointmentErrors.minutes)}
                    className={controlClass(Boolean(appointmentErrors.minutes))}
                  />
                  <FieldError>{appointmentErrors.minutes}</FieldError>
                </label>
              </div>
              <div className="block">
                <FieldLabel required invalid={Boolean(appointmentErrors.scheduledAt)}>
                  زمان (شمسی)
                </FieldLabel>
                <JalaliDateTimeField
                  value={appointment.scheduledAt}
                  invalid={Boolean(appointmentErrors.scheduledAt)}
                  onValueChange={(scheduledAt) => {
                    setAppointment((c) => ({ ...c, scheduledAt }));
                    setAppointmentErrors((current) => {
                      const { scheduledAt: _s, ...rest } = current;
                      return rest;
                    });
                  }}
                />
                <FieldError>{appointmentErrors.scheduledAt}</FieldError>
              </div>
              <label className="block">
                <FieldLabel>توضیح</FieldLabel>
                <input
                  value={appointment.note}
                  onChange={(e) => setAppointment((c) => ({ ...c, note: e.target.value }))}
                  className={inputClass}
                  maxLength={300}
                />
              </label>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => void scheduleAppointment()}
              className={cn(buttonVariants({ variant: "outline" }), "mt-3 h-10 border-navy/15 px-4")}
            >
              <CalendarClockIcon className="size-4" />
              ثبت جلسه
            </button>
          </SectionCard>

          <SectionCard title="یادداشت خصوصی" action={<Tone tone="bg-navy/5 text-navy/55">فقط شما</Tone>}>
            <textarea
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value);
                if (noteError) setNoteError(null);
              }}
              aria-invalid={Boolean(noteError)}
              className={controlClass(Boolean(noteError), textareaClass)}
              maxLength={4000}
              placeholder="نکات دفاع، ادله و پیگیری‌ها…"
            />
            <FieldError>{noteError}</FieldError>
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
                notes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-navy/8 bg-paper/50 p-3">
                    <p className="whitespace-pre-line text-sm leading-7 text-navy/75">{note.body}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-navy/40">{formatFaDateTime(note.createdAt)}</span>
                      <button
                        type="button"
                        onClick={() => void removeNote(note.id)}
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
        </div>
      </div>

      <ErrorNote>{error}</ErrorNote>
      <OkNote>{okMessage}</OkNote>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy/8 bg-white px-3 py-2.5">
      <dt className="text-[11px] text-navy/45">{label}</dt>
      <dd className="mt-1 text-sm text-navy/80">{value}</dd>
    </div>
  );
}
