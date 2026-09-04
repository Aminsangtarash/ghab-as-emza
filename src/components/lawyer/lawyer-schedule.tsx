"use client";

import { useCallback, useEffect, useState } from "react";
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
import { JalaliDateTimeField } from "@/components/ui/jalali-datetime-field";
import { SiteDataTable, SiteTableLink } from "@/components/ui/site-data-table";
import { SiteSelect } from "@/components/ui/site-select";
import {
  appointmentKindMeta,
  appointmentKinds,
  appointmentStatusMeta,
  type AppointmentStatus,
  type ClientAppointment,
} from "@/lib/appointment-model";
import { suggestNextAppointmentLocalValue } from "@/lib/appointment-slot";
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
    const [list, clientList, allAppointments] = await Promise.all([
      panelFetch<{ items: ClientAppointment[] }>(`/api/lawyer/appointments${query}`),
      panelFetch<{ items: LawyerClient[] }>("/api/lawyer/clients"),
      panelFetch<{ items: ClientAppointment[] }>("/api/lawyer/appointments"),
    ]);
    if (!list.ok) {
      setError(list.error);
      return;
    }
    setError(null);
    setItems(list.data.items);
    if (clientList.ok) setClients(clientList.data.items);
    const suggestionSource = allAppointments.ok ? allAppointments.data.items : list.data.items;
    setForm((current) =>
      current.scheduledAt
        ? current
        : { ...current, scheduledAt: suggestNextAppointmentLocalValue(suggestionSource) },
    );
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
    const all = await panelFetch<{ items: ClientAppointment[] }>("/api/lawyer/appointments");
    setForm((current) => ({
      ...current,
      note: "",
      scheduledAt: suggestNextAppointmentLocalValue(
        all.ok ? all.data.items : [{ scheduledAt: new Date(form.scheduledAt).toISOString() }],
      ),
    }));
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
        <div className="min-w-0">
          {items === null ? (
            <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
          ) : (
            <div className={cn(panelCard, "overflow-hidden p-0")}>
              <SiteDataTable
                rows={items}
                rowKey={(item) => item.id}
                pageSize={8}
                minWidthClassName="min-w-[40rem]"
                empty={
                  <div className="p-6">
                    <EmptyRow>نوبتی در این دسته نیست.</EmptyRow>
                  </div>
                }
                columns={[
                  {
                    id: "client",
                    header: "موکل",
                    headerClassName: "text-right",
                    className: "max-w-[10rem] text-right",
                    cell: (item) => (
                      <div className="min-w-0">
                        <p className="truncate font-medium text-navy">{item.clientName}</p>
                        <p className="mt-0.5 text-[11px] text-navy/45">{appointmentKindMeta[item.kind]}</p>
                      </div>
                    ),
                  },
                  {
                    id: "when",
                    header: "زمان",
                    className: "whitespace-nowrap text-navy/60",
                    cell: (item) => formatFaDateTime(item.scheduledAt),
                  },
                  {
                    id: "minutes",
                    header: "مدت",
                    hideOnMobile: true,
                    className: "whitespace-nowrap text-navy/60",
                    cell: (item) => `${toFaDigits(item.minutes)} دقیقه`,
                  },
                  {
                    id: "status",
                    header: "وضعیت",
                    className: "text-center",
                    cell: (item) => (
                      <Tone tone={appointmentStatusMeta[item.status].tone}>
                        {appointmentStatusMeta[item.status].title}
                      </Tone>
                    ),
                  },
                  {
                    id: "actions",
                    header: "اقدام",
                    className: "text-center",
                    cell: (item) => (
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {item.status === "scheduled" ? (
                          <>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => void setStatus(item.id, "done")}
                              className={cn(buttonVariants(), "h-8 bg-navy px-2.5 text-[11px] text-white hover:bg-navy-mid")}
                            >
                              انجام شد
                            </button>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => void setStatus(item.id, "cancelled")}
                              className={cn(buttonVariants({ variant: "ghost" }), "h-8 px-2 text-[11px] text-red-700")}
                            >
                              لغو
                            </button>
                          </>
                        ) : null}
                        {item.conversationId ? (
                          <SiteTableLink href={`/lawyer/chats/${item.conversationId}`} className="text-[11px]">
                            گفتگو
                          </SiteTableLink>
                        ) : null}
                        {item.caseId ? (
                          <SiteTableLink href={`/lawyer/cases/${item.caseId}`} className="text-[11px]">
                            پرونده
                          </SiteTableLink>
                        ) : null}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </div>

        <SectionCard title="ثبت نوبت جدید" hint="برای موکلی که قبلاً درخواست ثبت کرده است.">
          <div className="grid gap-3">
            <label className="block">
              <FieldLabel>موکل</FieldLabel>
              <SiteSelect
                value={form.userId || null}
                onValueChange={(userId) => setForm((current) => ({ ...current, userId }))}
                options={clients.map((client) => ({
                  value: client.userId,
                  label: `${client.fullName} — ${toFaDigits(client.phone)}`,
                }))}
                placeholder="انتخاب کنید…"
                className="h-11 w-full min-w-0"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>نوع جلسه</FieldLabel>
                <SiteSelect
                  value={form.kind}
                  onValueChange={(kind) =>
                    setForm((current) => ({
                      ...current,
                      kind: kind as (typeof appointmentKinds)[number],
                    }))
                  }
                  options={appointmentKinds.map((kind) => ({
                    value: kind,
                    label: appointmentKindMeta[kind],
                  }))}
                  className="h-11 w-full min-w-0"
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
            <div className="block">
              <FieldLabel>زمان (شمسی)</FieldLabel>
              <JalaliDateTimeField
                value={form.scheduledAt}
                onValueChange={(scheduledAt) => setForm((current) => ({ ...current, scheduledAt }))}
              />
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
