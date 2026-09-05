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
  conversationId?: string;
  documents: { id: string; originalName: string; size: number; mimeType?: string }[];
  documentRequestItems: {
    id: string;
    title: string;
    status: "pending" | "uploaded" | "approved" | "rejected";
    documentId?: string;
    documentName?: string;
    documentMimeType?: string;
    documentSize?: number;
    rejectReason?: string;
  }[];
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

/** مسیر نمایشی پیگیری پرونده برای موکل (فقط خواندنی). */
export const clientCaseStagePath: CaseStage[] = [
  "review",
  "filing",
  "first-court",
  "appeal",
  "supreme",
  "execution",
];

export type ClientProgressStepState = "done" | "current" | "upcoming" | "cancelled";

export type ClientProgressStep = {
  id: string;
  title: string;
  hint: string;
  state: ClientProgressStepState;
};

export function clientCaseStagePathFor(stage: CaseStage): CaseStage[] {
  if (stage === "arbitration") return ["review", "arbitration"];
  if (stage === "other") return ["review", "other"];
  if (!clientCaseStagePath.includes(stage)) {
    return [...clientCaseStagePath, stage];
  }
  // اگر پرونده در مرحله زودتر است، مسیر کامل استاندارد را نشان بده
  return clientCaseStagePath;
}

export function buildClientCaseProgress(input: {
  status: CaseStatus;
  stage: CaseStage;
}): ClientProgressStep[] {
  const { status, stage } = input;

  if (status === "declined") {
    return [
      {
        id: "proposed",
        title: "پیشنهاد تشکیل پرونده",
        hint: "وکیل پیشنهاد تشکیل پرونده را ثبت کرد.",
        state: "done",
      },
      {
        id: "declined",
        title: "پیشنهاد پذیرفته نشد",
        hint: "تشکیل پرونده از سوی شما تأیید نشد.",
        state: "cancelled",
      },
    ];
  }

  const stagePath = clientCaseStagePathFor(stage);
  const stageIndex = Math.max(0, stagePath.indexOf(stage));

  const lifecycle: ClientProgressStep[] = [
    {
      id: "proposed",
      title: "پیشنهاد تشکیل پرونده",
      hint: "وکیل پیشنهاد کارشناسی و تشکیل پرونده را ثبت کرد.",
      state: "done",
    },
    {
      id: "accepted",
      title: "تأیید شما",
      hint:
        status === "proposed"
          ? "در انتظار پذیرش شما برای شروع پیگیری است."
          : "پیشنهاد را پذیرفتید و پرونده تشکیل شد.",
      state: status === "proposed" ? "current" : "done",
    },
  ];

  if (status === "proposed") {
    for (const stepStage of stagePath) {
      lifecycle.push({
        id: `stage-${stepStage}`,
        title: caseStageMeta[stepStage],
        hint: "پس از تأیید شما فعال می‌شود.",
        state: "upcoming",
      });
    }
    lifecycle.push({
      id: "closed",
      title: "اتمام پرونده",
      hint: "پس از جمع‌بندی نهایی وکیل تکمیل می‌شود.",
      state: "upcoming",
    });
    return lifecycle;
  }

  for (let index = 0; index < stagePath.length; index += 1) {
    const stepStage = stagePath[index]!;
    let state: ClientProgressStepState = "upcoming";
    if (status === "closed") {
      state = "done";
    } else if (index < stageIndex) {
      state = "done";
    } else if (index === stageIndex) {
      state = status === "on-hold" ? "current" : "current";
    }
    lifecycle.push({
      id: `stage-${stepStage}`,
      title: caseStageMeta[stepStage],
      hint:
        state === "current"
          ? status === "on-hold"
            ? "پرونده موقتاً معلق است؛ همین مرحله جاری محسوب می‌شود."
            : "مرحله جاری پرونده شما."
          : state === "done"
            ? "این مرحله پشت سر گذاشته شده است."
            : "هنوز به این مرحله نرسیده‌اید.",
      state,
    });
  }

  lifecycle.push({
    id: "closed",
    title: "اتمام پرونده",
    hint:
      status === "closed"
        ? "پرونده با جمع‌بندی نهایی بسته شده است."
        : "پس از جمع‌بندی نهایی وکیل تکمیل می‌شود.",
    state: status === "closed" ? "done" : "upcoming",
  });

  return lifecycle;
}

export function clientCaseProgressSummary(steps: ClientProgressStep[]) {
  const current = steps.find((step) => step.state === "current");
  const doneCount = steps.filter((step) => step.state === "done").length;
  const total = steps.length;
  return {
    currentTitle: current?.title ?? (steps.every((s) => s.state === "done") ? "اتمام یافته" : "—"),
    doneCount,
    total,
    percent: total === 0 ? 0 : Math.round((doneCount / total) * 100),
  };
}
