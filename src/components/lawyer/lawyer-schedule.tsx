"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClockIcon } from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  FieldLabel,
  LawyerHeading,
  OkNote,
  SectionCard,
  Tone,
  inputClass,
  panelCard,
  panelFetch,
} from "@/components/lawyer/lawyer-ui";
import { buttonVariants } from "@/components/ui/button";
import {
  appointmentKindMeta,
  appointmentKinds,
  appointmentStatusMeta,
  type AppointmentStatus,
  type ClientAppointment,
} from "@/lib/appointment-model";
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import type { LawyerClient } from "@/lib/lawyer-desk";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "upcoming", label: "پیش‌رو" },
  { id: "scheduled", label: "زمان‌بندی‌شده" },
  { id: "done", label: "انجام‌شده" },
  { id: "all", label: "همه" },
] as const;

export function LawyerSchedule() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("upcoming");
  const [items, setItems] = useState<ClientAppointment[] | null>(null);
  const [clients, setClients] = useState<LawyerClient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    kind: "phone" as (typeof appointmentKinds)[number],
    scheduledAt: "",
    minutes: "30",
    note: "",
  });

  const load = useCallback(async () => {
    const query =
      tab === "upcoming"
        ? "?scope=upcoming&status=scheduled"
        : tab === "all"
          ? ""
          : `?status=${tab}`;
    const [list, clientList] = await Promise.all([
      panelFetch<{ items: ClientAppointment[] }>(`/api/lawyer/appointments${query}`),
      panelFetch<{ items: LawyerClient[] }>("/api/lawyer/clients"),
    ]);
    if (!list.ok) {
      setError(list.error);
      return;
    }
    setError(null);
    setItems(list.data.items);
    if (clientList.ok) setClients(clientList.data.items);
  }, [tab]);

  useEffect(() => {
    setItems(null);
    void load();
  }, [load]);

  async function setStatus(id: string, status: AppointmentStatus) {
    setPending(true);
    const result = await panelFetch(`/api/lawyer/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOkMessage("وضعیت نوبت به‌روزرسانی شد.");
    await load();
  }

  async function create() {
    if (!form.userId) {
      setError("موکل را انتخاب کنید.");
      return;
    }
    if (!form.scheduledAt) {
      setError("زمان جلسه را انتخاب کنید.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await panelFetch("/api/lawyer/appointments", {
      method: "POST",
      body: JSON.stringify({
        userId: form.userId,
        kind: form.kind,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        minutes: Number(form.minutes) || 30,
        note: form.note,
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOkMessage("نوبت ثبت شد.");
    setForm((current) => ({ ...current, scheduledAt: "", note: "" }));
    await load();
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker="برنامه کاری"
        title="نوبت‌ها"
        description="جلسه‌های تلفنی، تصویری و حضوری خود را ثبت و وضعیت هرکدام را مشخص کنید. نوبت‌های ثبت‌شده در گفتگوی موکل هم دیده می‌شود."
      />

      <div className={cn(panelCard, "flex flex-wrap gap-2 px-4 py-3")}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition",
              tab === item.id ? "bg-navy text-white" : "bg-paper text-navy/60 hover:bg-navy/5",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ErrorNote>{error}</ErrorNote>
      <OkNote>{okMessage}</OkNote>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0 space-y-3">
          {items === null ? (
            <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
          ) : items.length === 0 ? (
            <div className={cn(panelCard, "px-6 py-10")}>
              <EmptyRow>نوبتی در این دسته نیست.</EmptyRow>
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} className={cn(panelCard, "px-5 py-4")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-navy">
                      {appointmentKindMeta[item.kind]} — {item.clientName}
                    </p>
                    <p className="mt-1 text-sm text-navy/60">{formatFaDateTime(item.scheduledAt)}</p>
                    <p className="mt-1 text-xs text-navy/40">
                      {toFaDigits(item.minutes)} دقیقه
                      {item.clientPhone ? ` · ${toFaDigits(item.clientPhone)}` : ""}
                      {item.trackingCode ? ` · ${toFaDigits(item.trackingCode)}` : ""}
                    </p>
                  </div>
                  <Tone tone={appointmentStatusMeta[item.status].tone}>
                    {appointmentStatusMeta[item.status].title}
                  </Tone>
                </div>
                {item.note ? <p className="mt-2 text-sm leading-7 text-navy/65">{item.note}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.status === "scheduled" && (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void setStatus(item.id, "done")}
                        className={cn(buttonVariants(), "h-9 bg-navy px-4 text-white hover:bg-navy-mid")}
                      >
                        انجام شد
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void setStatus(item.id, "missed")}
                        className={cn(buttonVariants({ variant: "outline" }), "h-9 border-navy/15 px-4")}
                      >
                        انجام نشد
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void setStatus(item.id, "cancelled")}
                        className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-red-700")}
                      >
                        لغو
                      </button>
                    </>
                  )}
                  {item.conversationId ? (
                    <Link
                      href={`/lawyer/chats/${item.conversationId}`}
                      className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-navy/60")}
                    >
                      گفتگو
                    </Link>
                  ) : null}
                  {item.caseId ? (
                    <Link
                      href={`/lawyer/cases/${item.caseId}`}
                      className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-navy/60")}
                    >
                      پرونده
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>

        <SectionCard title="ثبت نوبت جدید" hint="برای موکلی که قبلاً درخواست ثبت کرده است.">
          <div className="grid gap-3">
            <label className="block">
              <FieldLabel>موکل</FieldLabel>
              <select
                value={form.userId}
                onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
                className={inputClass}
              >
                <option value="">انتخاب کنید…</option>
                {clients.map((client) => (
                  <option key={client.userId} value={client.userId}>
                    {client.fullName} — {toFaDigits(client.phone)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <FieldLabel>نوع جلسه</FieldLabel>
              <select
                value={form.kind}
                onChange={(event) =>
                  setForm((current) => ({
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
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>زمان</FieldLabel>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <FieldLabel>مدت (دقیقه)</FieldLabel>
                <input
                  type="number"
                  min={5}
                  max={480}
                  value={form.minutes}
                  onChange={(event) => setForm((current) => ({ ...current, minutes: event.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="block">
              <FieldLabel>توضیح (اختیاری)</FieldLabel>
              <input
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                className={inputClass}
                maxLength={300}
              />
            </label>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => void create()}
            className={cn(buttonVariants(), "mt-3 h-10 bg-gold px-5 text-navy-deep hover:bg-gold-bright")}
          >
            <CalendarClockIcon className="size-4" />
            ثبت نوبت
          </button>
        </SectionCard>
      </div>
    </div>
  );
}
