export const caseStatuses = ["proposed", "active", "on-hold", "closed", "declined"] as const;
export type CaseStatus = (typeof caseStatuses)[number];

export const caseStages = [
  "review",
  "filing",
  "first-court",
  "appeal",
  "supreme",
  "execution",
  "arbitration",
  "other",
] as const;
export type CaseStage = (typeof caseStages)[number];

export const caseEventKinds = ["note", "hearing", "filing", "status", "payment", "document"] as const;
export type CaseEventKind = (typeof caseEventKinds)[number];

export const caseStatusMeta: Record<CaseStatus, { title: string; hint: string; tone: string }> = {
  proposed: {
    title: "در انتظار تأیید موکل",
    hint: "پیشنهاد تشکیل پرونده ثبت شده و موکل باید آن را بپذیرد.",
    tone: "bg-amber-50 text-amber-800",
  },
  active: {
    title: "جاری",
    hint: "پرونده در جریان است و اقدام‌ها در تایم‌لاین ثبت می‌شود.",
    tone: "bg-emerald-50 text-emerald-800",
  },
  "on-hold": {
    title: "معلق",
    hint: "پیگیری موقتاً متوقف است؛ دلیل در تایم‌لاین ثبت می‌شود.",
    tone: "bg-sky-50 text-sky-800",
  },
  closed: {
    title: "بسته شده",
    hint: "پرونده با جمع‌بندی نهایی بسته شده است.",
    tone: "bg-navy/5 text-navy/55",
  },
  declined: {
    title: "رد شده",
    hint: "موکل پیشنهاد تشکیل پرونده را نپذیرفت.",
    tone: "bg-red-50 text-red-700",
  },
};

export const caseStageMeta: Record<CaseStage, string> = {
  review: "کارشناسی و بررسی اولیه",
  filing: "تنظیم و ثبت دادخواست یا شکایت",
  "first-court": "رسیدگی بدوی",
  appeal: "تجدیدنظر",
  supreme: "دیوان عالی یا فرجام",
  execution: "اجرای حکم",
  arbitration: "داوری",
  other: "سایر",
};

export const caseEventKindMeta: Record<CaseEventKind, { title: string; tone: string }> = {
  note: { title: "یادداشت", tone: "bg-navy/5 text-navy/60" },
  hearing: { title: "جلسه رسیدگی", tone: "bg-gold/15 text-gold-deep" },
  filing: { title: "ثبت لایحه یا دادخواست", tone: "bg-sky-50 text-sky-800" },
  status: { title: "تغییر وضعیت", tone: "bg-emerald-50 text-emerald-800" },
  payment: { title: "مالی", tone: "bg-amber-50 text-amber-800" },
  document: { title: "مدارک", tone: "bg-navy/5 text-navy/60" },
};

export type ClientCaseEvent = {
  id: string;
  kind: CaseEventKind;
  title: string;
  body?: string;
  happensAt?: string;
  authorRole: "lawyer" | "client" | "system";
  visibleToClient: boolean;
  createdAt: string;
};

export type ClientCase = {
  id: string;
  caseNumber: string;
  title: string;
  summary: string;
  status: CaseStatus;
  stage: CaseStage;
  authority?: string;
  courtBranch?: string;
  fileNumber?: string;
  feeToman: number;
  paidToman: number;
  nextActionAt?: string;
  nextActionNote?: string;
  clientNote?: string;
  closeNote?: string;
  lawyerSlug: string;
  lawyerName: string;
  clientName: string;
  clientPhone?: string;
  trackingCode?: string;
  createdAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  closedAt?: string;
  events: ClientCaseEvent[];
  eventCount: number;
};

export function isCaseOpen(status: CaseStatus) {
  return status === "active" || status === "on-hold" || status === "proposed";
}

export function parseCaseStatus(value: unknown): CaseStatus | undefined {
  return caseStatuses.includes(value as CaseStatus) ? (value as CaseStatus) : undefined;
}

export function parseCaseStage(value: unknown): CaseStage | undefined {
  return caseStages.includes(value as CaseStage) ? (value as CaseStage) : undefined;
}

export function parseCaseEventKind(value: unknown): CaseEventKind | undefined {
  return caseEventKinds.includes(value as CaseEventKind) ? (value as CaseEventKind) : undefined;
}
