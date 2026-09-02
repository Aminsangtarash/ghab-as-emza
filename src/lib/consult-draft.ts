import {
  caseStages,
  consultChannels,
  lawyerModes,
  timeSlots,
  urgencies,
  type CaseStage,
  type ConsultChannel,
  type LawyerMode,
  type TimeSlot,
  type Urgency,
} from "@/lib/consult";

export type ConsultWizardDraft = {
  channel: ConsultChannel | "";
  service: string;
  lawyerMode: LawyerMode | "";
  lawyerSlug: string;
  subject: string;
  message: string;
  urgency: Urgency;
  caseStage: CaseStage | "";
  city: string;
  hasDocuments: "yes" | "no" | "";
  preferredSlot: TimeSlot | "";
  fullName: string;
  phone: string;
  email: string;
  consent: boolean;
  discountCode: string;
};

export type ConsultDraftState = {
  step: number;
  draft: ConsultWizardDraft;
  updatedAt: string;
};

const LAST_STEP = 6;
const STORAGE_PREFIX = "gae:consult-draft:";

export function emptyConsultDraft(seed?: { lawyerSlug?: string; service?: string }): ConsultWizardDraft {
  return {
    channel: "",
    service: seed?.service ?? "",
    lawyerMode: seed?.lawyerSlug ? "chosen" : "",
    lawyerSlug: seed?.lawyerSlug ?? "",
    subject: "",
    message: "",
    urgency: "normal",
    caseStage: "",
    city: "",
    hasDocuments: "",
    preferredSlot: "",
    fullName: "",
    phone: "",
    email: "",
    consent: false,
    discountCode: "",
  };
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T | ""): T | "" {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function asString(value: unknown, max = 3000) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

export function parseConsultDraftState(input: unknown, lastStep = LAST_STEP): ConsultDraftState | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const draftRaw =
    raw.draft && typeof raw.draft === "object" ? (raw.draft as Record<string, unknown>) : raw;

  const hasDocuments =
    draftRaw.hasDocuments === "yes" || draftRaw.hasDocuments === "no" ? draftRaw.hasDocuments : "";

  const stepValue = Number(raw.step);
  const step = Number.isInteger(stepValue) ? Math.min(lastStep, Math.max(1, stepValue)) : 1;

  return {
    step,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    draft: {
      channel: asEnum(draftRaw.channel, consultChannels, ""),
      service: asString(draftRaw.service, 80),
      lawyerMode: asEnum(draftRaw.lawyerMode, lawyerModes, ""),
      lawyerSlug: asString(draftRaw.lawyerSlug, 80),
      subject: asString(draftRaw.subject, 120),
      message: asString(draftRaw.message, 3000),
      urgency: asEnum(draftRaw.urgency, urgencies, "normal") || "normal",
      caseStage: asEnum(draftRaw.caseStage, caseStages, ""),
      city: asString(draftRaw.city, 40),
      hasDocuments,
      preferredSlot: asEnum(draftRaw.preferredSlot, timeSlots, ""),
      fullName: asString(draftRaw.fullName, 80),
      phone: asString(draftRaw.phone, 20),
      email: asString(draftRaw.email, 120),
      consent: draftRaw.consent === true,
      discountCode: asString(draftRaw.discountCode, 24),
    },
  };
}

export function readLocalConsultDraft(userId: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    return parseConsultDraftState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeLocalConsultDraft(userId: string, state: ConsultDraftState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(state));
}

export function clearLocalConsultDraft(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
}
