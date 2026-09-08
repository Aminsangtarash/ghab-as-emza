import "server-only";

import { lawyerLabel, type ConsultationStatus, type LawyerMode } from "@/lib/consult";
import { prisma } from "@/lib/db";

function parseRejectedSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function consultationRejectedSlugs(row: { rejectedLawyerSlugs?: unknown }) {
  return parseRejectedSlugs(row.rejectedLawyerSlugs);
}

/**
 * رد وکیل: بدون استرداد. مبلغ محفوظ می‌ماند تا انتخاب وکیل دیگر یا انصراف تأییدشده.
 */
export async function rejectConsultationByLawyer(input: {
  trackingCode: string;
  lawyerSlug: string;
  reason?: string;
}) {
  const row = await prisma.consultation.findUnique({ where: { trackingCode: input.trackingCode } });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status === "cancelled" || row.status === "closed" || row.status === "cancel-requested") {
    return { error: "این درخواست دیگر قابل رد نیست." as const };
  }
  if (row.status === "in-progress") {
    return { error: "گفتگوی فعال را نمی‌توان رد کرد؛ در صورت نیاز گفتگو را ببندید." as const };
  }
  if (row.status !== "awaiting-lawyer" && row.status !== "awaiting-operator") {
    return { error: "این درخواست در وضعیت قابل رد نیست." as const };
  }
  if (row.lawyerSlug && row.lawyerSlug !== input.lawyerSlug) {
    return { error: "این درخواست برای وکیل دیگری است." as const };
  }

  const reason = input.reason?.trim() || "عدم پذیرش توسط وکیل";
  const rejected = new Set(consultationRejectedSlugs(row));
  rejected.add(input.lawyerSlug);

  const wasChosen = row.lawyerMode === "chosen" && Boolean(row.lawyerSlug);
  const nextStatus: ConsultationStatus = wasChosen ? "awaiting-reselect" : "awaiting-operator";

  await prisma.consultation.update({
    where: { id: row.id },
    data: {
      status: nextStatus,
      lawyerSlug: null,
      lawyerMode: wasChosen ? "chosen" : "assign",
      lawyerVisible: false,
      lastRejectReason: reason.slice(0, 500),
      rejectedLawyerSlugs: Array.from(rejected),
      cancelReason: null,
      cancelledAt: null,
    },
  });

  return {
    ok: true as const,
    status: nextStatus,
    message: wasChosen
      ? "رد ثبت شد. موکل باید وکیل دیگری انتخاب کند یا منتظر اپراتور بماند."
      : "رد ثبت شد. درخواست به صف اپراتور برگشت؛ مبلغ استرداد نشد.",
  };
}

/**
 * درخواست انصراف توسط موکل — بدون استرداد فوری؛ منتظر تأیید مدیر.
 */
export async function requestConsultationCancel(input: {
  trackingCode: string;
  userId: string;
  reason?: string;
}) {
  const row = await prisma.consultation.findUnique({ where: { trackingCode: input.trackingCode } });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.userId !== input.userId) return { error: "اجازه انصراف این درخواست را ندارید." as const };
  if (row.status === "cancelled" || row.status === "closed") {
    return { error: "این درخواست قبلاً بسته یا لغو شده است." as const };
  }
  if (row.status === "in-progress") {
    return { error: "گفتگوی فعال را فقط وکیل می‌تواند ببندد؛ لغو از این مرحله ممکن نیست." as const };
  }
  if (row.status === "cancel-requested") {
    return { error: "درخواست انصراف قبلاً ثبت شده و در انتظار تأیید مدیر است." as const };
  }

  const reason = input.reason?.trim() || "انصراف توسط کاربر";

  await prisma.consultation.update({
    where: { id: row.id },
    data: {
      status: "cancel-requested",
      statusBeforeCancel: row.status,
      cancelRequestedAt: new Date(),
      cancelReason: reason.slice(0, 500),
    },
  });

  return { ok: true as const };
}

export async function approveConsultationCancel(trackingCode: string, staffNote?: string) {
  const row = await prisma.consultation.findUnique({ where: { trackingCode } });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status !== "cancel-requested") {
    return { error: "این مورد درخواست انصراف در انتظار تأیید نیست." as const };
  }

  await prisma.consultation.update({
    where: { id: row.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: (staffNote?.trim() || row.cancelReason || "تأیید انصراف توسط مدیریت").slice(0, 500),
      cancelRequestedAt: null,
      statusBeforeCancel: null,
    },
  });

  let refunded = 0;
  if (row.paymentStatus === "stub-paid" && row.feeToman > 0 && row.refundedToman <= 0) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { walletBalance: { increment: row.feeToman } },
      }),
      prisma.walletEntry.create({
        data: {
          userId: row.userId,
          amount: row.feeToman,
          reason: "refund",
          consultationId: row.id,
          note: "استرداد پس از تأیید انصراف توسط مدیر",
        },
      }),
      prisma.consultation.update({
        where: { id: row.id },
        data: { paymentStatus: "refunded-wallet", refundedToman: row.feeToman },
      }),
    ]);
    refunded = row.feeToman;
  }

  return { ok: true as const, refunded };
}

export async function denyConsultationCancel(trackingCode: string, staffNote?: string) {
  const row = await prisma.consultation.findUnique({ where: { trackingCode } });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status !== "cancel-requested") {
    return { error: "این مورد درخواست انصراف در انتظار تأیید نیست." as const };
  }

  const restore = (row.statusBeforeCancel as ConsultationStatus | null) || "awaiting-operator";
  const allowed: ConsultationStatus[] = [
    "awaiting-operator",
    "awaiting-lawyer",
    "awaiting-reselect",
  ];
  const nextStatus = allowed.includes(restore) ? restore : "awaiting-operator";

  await prisma.consultation.update({
    where: { id: row.id },
    data: {
      status: nextStatus,
      cancelRequestedAt: null,
      statusBeforeCancel: null,
      cancelReason: staffNote?.trim()
        ? `انصراف رد شد: ${staffNote.trim().slice(0, 400)}`
        : null,
    },
  });

  return { ok: true as const, status: nextStatus };
}

export async function reselectConsultationLawyer(input: {
  trackingCode: string;
  userId: string;
  mode: "chosen" | "assign";
  lawyerSlug?: string;
}) {
  const row = await prisma.consultation.findUnique({ where: { trackingCode: input.trackingCode } });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.userId !== input.userId) return { error: "اجازه تغییر این درخواست را ندارید." as const };
  if (row.status === "cancel-requested") {
    return { error: "تا تعیین تکلیف انصراف، انتخاب وکیل ممکن نیست." as const };
  }
  if (row.status !== "awaiting-reselect" && row.status !== "awaiting-operator") {
    return { error: "الان امکان انتخاب مجدد وکیل برای این درخواست نیست." as const };
  }

  const rejected = consultationRejectedSlugs(row);

  if (input.mode === "assign") {
    await prisma.consultation.update({
      where: { id: row.id },
      data: {
        status: "awaiting-operator",
        lawyerMode: "assign",
        lawyerSlug: null,
        lawyerVisible: false,
        lastRejectReason: row.lastRejectReason,
      },
    });
    return { ok: true as const, status: "awaiting-operator" as const };
  }

  const lawyerSlug = input.lawyerSlug?.trim();
  if (!lawyerSlug) return { error: "وکیل را انتخاب کنید." as const };
  if (rejected.includes(lawyerSlug)) {
    return { error: "این وکیل قبلاً این پرونده را نپذیرفته است. وکیل دیگری انتخاب کنید." as const };
  }

  const account = await prisma.user.findFirst({
    where: { role: "lawyer", lawyerSlug, active: true },
    select: { id: true },
  });
  if (!account) return { error: "وکیل فعال یافت نشد." as const };

  await prisma.consultation.update({
    where: { id: row.id },
    data: {
      status: "awaiting-lawyer",
      lawyerMode: "chosen" satisfies LawyerMode,
      lawyerSlug,
      lawyerVisible: true,
      lastRejectReason: row.lastRejectReason,
    },
  });

  return {
    ok: true as const,
    status: "awaiting-lawyer" as const,
    lawyerName: lawyerLabel(lawyerSlug),
  };
}

/** سازگاری با APIهای قدیمی: actor=lawyer → رد بدون استرداد؛ actor=user → درخواست انصراف */
export async function rejectOrCancelConsultation(input: {
  trackingCode: string;
  actor: "lawyer" | "user";
  lawyerSlug?: string;
  userId?: string;
  reason?: string;
}) {
  if (input.actor === "lawyer") {
    if (!input.lawyerSlug) return { error: "شناسه وکیل لازم است." as const };
    const result = await rejectConsultationByLawyer({
      trackingCode: input.trackingCode,
      lawyerSlug: input.lawyerSlug,
      reason: input.reason,
    });
    if ("error" in result) return result;
    return { ok: true as const, refunded: 0 };
  }

  if (!input.userId) return { error: "شناسه کاربر لازم است." as const };
  const result = await requestConsultationCancel({
    trackingCode: input.trackingCode,
    userId: input.userId,
    reason: input.reason,
  });
  if ("error" in result) return result;
  return { ok: true as const, refunded: 0 };
}
