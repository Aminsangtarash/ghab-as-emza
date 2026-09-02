import { getService, lawyers, type Lawyer } from "@/lib/data";

export const consultChannels = ["text", "phone", "video"] as const;
export type ConsultChannel = (typeof consultChannels)[number];

export const lawyerModes = ["chosen", "assign"] as const;
export type LawyerMode = (typeof lawyerModes)[number];

export const urgencies = ["normal", "soon", "urgent"] as const;
export type Urgency = (typeof urgencies)[number];

export const caseStages = ["before-sign", "dispute", "in-court", "other"] as const;
export type CaseStage = (typeof caseStages)[number];

export const timeSlots = [
  "weekday-morning",
  "weekday-mid",
  "weekday-afternoon",
  "thursday-morning",
] as const;
export type TimeSlot = (typeof timeSlots)[number];

export const consultChannelMeta: Record<
  ConsultChannel,
  { title: string; hint: string; place: string; onSite: boolean }
> = {
  text: {
    title: "مشاوره متنی",
    hint: "شرح موضوع و پاسخ وکیل در پنل کاربری ثبت و پیگیری می‌شود.",
    place: "داخل سایت",
    onSite: true,
  },
  phone: {
    title: "تماس تلفنی",
    hint: "هماهنگی در سایت انجام می‌شود؛ خود تماس را دفتر در ساعات کاری برقرار می‌کند.",
    place: "خارج از سایت",
    onSite: false,
  },
  video: {
    title: "تماس تصویری",
    hint: "پس از تأیید، جلسه تصویری در پنل کاربری برگزار می‌شود.",
    place: "داخل سایت",
    onSite: true,
  },
};

export const urgencyMeta: Record<Urgency, { title: string; hint: string }> = {
  normal: { title: "عادی", hint: "پاسخ در ساعات کاری، بدون فوریت خاص" },
  soon: { title: "زودتر", hint: "ترجیح می‌دهید در اولین نوبت خالی بررسی شود" },
  urgent: { title: "فوری", hint: "مهلت قانونی یا امضای نزدیک دارید" },
};

export const caseStageMeta: Record<CaseStage, string> = {
  "before-sign": "قبل از امضا یا اقدام",
  dispute: "اختلاف شروع شده؛ هنوز دادگاه نیست",
  "in-court": "پرونده در مرجع قضایی یا داوری است",
  other: "سایر / مشخص نیست",
};

export const timeSlotMeta: Record<TimeSlot, string> = {
  "weekday-morning": "شنبه تا چهارشنبه، ۹ تا ۱۲",
  "weekday-mid": "شنبه تا چهارشنبه، ۱۲ تا ۱۵",
  "weekday-afternoon": "شنبه تا چهارشنبه، ۱۵ تا ۱۸",
  "thursday-morning": "پنجشنبه، ۹ تا ۱۴",
};

export function consultableServices<T extends { slug: string }>(all: T[]) {
  return all.filter((item) => item.slug !== "lawyers");
}

export function lawyerLabel(slug: string | undefined, fallback?: Lawyer) {
  if (fallback) return fallback.name;
  if (!slug) return undefined;
  return lawyers.find((item) => item.slug === slug)?.name;
}

export function serviceTitle(slug: string) {
  return getService(slug)?.title ?? slug;
}

export function serviceFeeToman(slug: string) {
  return getService(slug)?.feeToman ?? 0;
}

export function isFreeService(slug: string) {
  return serviceFeeToman(slug) <= 0;
}

export const consultationStatuses = [
  "awaiting-operator",
  "awaiting-lawyer",
  "in-progress",
  "closed",
] as const;
export type ConsultationStatus = (typeof consultationStatuses)[number];

export const consultationStatusMeta: Record<
  ConsultationStatus,
  { title: string; hint: string }
> = {
  "awaiting-operator": {
    title: "در انتظار معرفی وکیل",
    hint: "اپراتور موضوع را می‌بیند و متخصص مناسب را مشخص می‌کند.",
  },
  "awaiting-lawyer": {
    title: "در انتظار تأیید وکیل",
    hint: "وکیل انتخابی باید پذیرش درخواست را تأیید کند.",
  },
  "in-progress": {
    title: "در حال پیگیری",
    hint: "درخواست به مرحله مشاوره یا هماهنگی رسیده است.",
  },
  closed: {
    title: "بسته شده",
    hint: "این درخواست به پایان رسیده است.",
  },
};

export function initialConsultationStatus(lawyerMode: LawyerMode): ConsultationStatus {
  return lawyerMode === "assign" ? "awaiting-operator" : "awaiting-lawyer";
}

export const paymentStatusMeta: Record<"free" | "stub-paid", string> = {
  free: "رایگان",
  "stub-paid": "پرداخت‌شده (آزمایشی)",
};
