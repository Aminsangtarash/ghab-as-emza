import { resolveLawyer, resolveServiceFee } from "@/lib/catalog-cache";
import { getService, type Lawyer } from "@/lib/data";

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
  normal: { title: "عادی", hint: "پاسخ در ساعات کاری؛ تعرفه پایه خدمت" },
  soon: { title: "زودتر", hint: "اولین نوبت خالی؛ ۲۵٪ به مبلغ خدمت اضافه می‌شود" },
  urgent: { title: "فوری", hint: "مهلت نزدیک؛ ۵۰٪ به مبلغ خدمت اضافه می‌شود" },
};

/** درصد افزایش روی تعرفه خدمت، قبل از کد تخفیف */
export const urgencyFeePercent: Record<Urgency, number> = {
  normal: 0,
  soon: 25,
  urgent: 50,
};

export function applyUrgencyToFee(baseToman: number, urgency: Urgency) {
  if (baseToman <= 0) return 0;
  const percent = urgencyFeePercent[urgency];
  if (!percent) return baseToman;
  return Math.round((baseToman * (100 + percent)) / 100);
}

export function consultBaseFeeToman(serviceSlug: string, urgency: Urgency) {
  // تعرفه مشاوره فوری خودش نهایی است؛ ضریب urgency دوباره اعمال نمی‌شود.
  if (isUrgentConsultService(serviceSlug)) return serviceFeeToman(serviceSlug);
  return applyUrgencyToFee(serviceFeeToman(serviceSlug), urgency);
}

export const URGENT_CONSULT_SERVICE = "urgent-consult";
export const IN_PERSON_SERVICE = "in-person";
/** مهلت یافتن وکیل برای درخواست فوری (۱۵ دقیقه) */
export const URGENT_MATCH_SLA_MS = 15 * 60_000;
/** در این بازه فقط وکلای هم‌شهر می‌توانند بپذیرند (اگر شهر ثبت شده باشد) */
export const URGENT_CITY_PRIORITY_MS = 5 * 60_000;

export function isUrgentConsultService(slug: string) {
  return slug === URGENT_CONSULT_SERVICE;
}

export function isInPersonService(slug: string) {
  return slug === IN_PERSON_SERVICE;
}

export function normalizeCityName(city?: string | null) {
  return (city ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLowerCase();
}

export function citiesMatch(a?: string | null, b?: string | null) {
  const left = normalizeCityName(a);
  const right = normalizeCityName(b);
  return Boolean(left && right && left === right);
}

/** آیا هنوز پنجرهٔ اولویت هم‌شهر برای این درخواست باز است؟ */
export function isUrgentCityPriorityActive(createdAt: Date | string, now = new Date()) {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return now.getTime() - created.getTime() < URGENT_CITY_PRIORITY_MS;
}

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
  return all.filter(
    (item) =>
      item.slug !== "lawyers" &&
      !isUrgentConsultService(item.slug) &&
      !isInPersonService(item.slug),
  );
}

export function lawyerLabel(slug: string | undefined, fallback?: Lawyer) {
  if (fallback) return fallback.name;
  if (!slug) return undefined;
  return resolveLawyer(slug)?.name;
}

export function serviceTitle(slug: string) {
  return getService(slug)?.title ?? slug;
}

export function serviceFeeToman(slug: string) {
  return resolveServiceFee(slug);
}

export function isFreeService(slug: string) {
  return serviceFeeToman(slug) <= 0;
}

export const consultationStatuses = [
  "awaiting-operator",
  "awaiting-lawyer",
  "in-progress",
  "closed",
  "cancelled",
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
    hint: "وکیل انتخابی باید پذیرش درخواست را تأیید کند. در صورت رد، مبلغ به کیف پول برمی‌گردد.",
  },
  "in-progress": {
    title: "گفتگو فعال",
    hint: "وکیل درخواست را پذیرفته است. گفتگو، تماس تصویری یا هماهنگی تماس تلفنی از بخش گفتگوها انجام می‌شود.",
  },
  closed: {
    title: "بسته شده",
    hint: "وکیل این مورد را بسته است. می‌توانید به جلسه امتیاز بدهید.",
  },
  cancelled: {
    title: "لغو شده",
    hint: "درخواست لغو شد. اگر پرداختی انجام شده بود، به کیف پول شما برگشت.",
  },
};

export function initialConsultationStatus(
  lawyerMode: LawyerMode,
  service?: string,
): ConsultationStatus {
  // فوری: پخش به همه وکلا (صف awaiting-lawyer با lawyerSlug خالی)
  if (service && isUrgentConsultService(service)) return "awaiting-lawyer";
  return lawyerMode === "assign" ? "awaiting-operator" : "awaiting-lawyer";
}

export type PaymentStatus = "free" | "stub-paid" | "refunded-wallet";

export const paymentStatusMeta: Record<PaymentStatus, string> = {
  free: "رایگان",
  "stub-paid": "پرداخت‌شده (آزمایشی)",
  "refunded-wallet": "برگشت به کیف پول",
};
