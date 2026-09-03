export const appointmentKinds = ["phone", "video", "in-person"] as const;
export type AppointmentKind = (typeof appointmentKinds)[number];

export const appointmentStatuses = ["scheduled", "done", "missed", "cancelled"] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const appointmentKindMeta: Record<AppointmentKind, string> = {
  phone: "تماس تلفنی",
  video: "تماس تصویری",
  "in-person": "جلسه حضوری",
};

export const appointmentStatusMeta: Record<AppointmentStatus, { title: string; tone: string }> = {
  scheduled: { title: "زمان‌بندی‌شده", tone: "bg-sky-50 text-sky-800" },
  done: { title: "انجام شد", tone: "bg-emerald-50 text-emerald-800" },
  missed: { title: "انجام نشد", tone: "bg-amber-50 text-amber-800" },
  cancelled: { title: "لغو شد", tone: "bg-red-50 text-red-700" },
};

export type ClientAppointment = {
  id: string;
  kind: AppointmentKind;
  status: AppointmentStatus;
  scheduledAt: string;
  minutes: number;
  note?: string;
  clientName: string;
  clientPhone?: string;
  conversationId?: string;
  caseId?: string;
  trackingCode?: string;
  subject?: string;
};

export function parseAppointmentKind(value: unknown): AppointmentKind | undefined {
  return appointmentKinds.includes(value as AppointmentKind) ? (value as AppointmentKind) : undefined;
}

export function parseAppointmentStatus(value: unknown): AppointmentStatus | undefined {
  return appointmentStatuses.includes(value as AppointmentStatus)
    ? (value as AppointmentStatus)
    : undefined;
}
