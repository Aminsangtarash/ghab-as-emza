import type { Consultation } from "@/generated/prisma";
import { Prisma } from "@/generated/prisma";

import {
  consultBaseFeeToman,
  initialConsultationStatus,
  lawyerLabel,
  serviceTitle,
  type ConsultationStatus,
  type PaymentStatus,
} from "@/lib/consult";
import {
  emptyConsultDraft,
  parseConsultDraftState,
  type ConsultDraftState,
} from "@/lib/consult-draft";
import { attachPendingDocuments, removeStoredFiles } from "@/lib/consult-documents";
import { prisma } from "@/lib/db";
import { quotePayment } from "@/lib/promos";
import type { ConsultationInput } from "@/lib/validations";
import type { ClientConsultation, StoredConsultation } from "@/lib/store-types";

export type {
  ClientConsultation,
  PublicUser,
  StoredConsultation,
  StoredUser,
  UserRole,
} from "@/lib/store-types";
export { parseUserRole } from "@/lib/store-types";

export {
  createSession,
  createUser,
  deleteSession,
  findUserByPhone,
  getUserBySession,
  markUserLogin,
  toPublicUser,
  updateUserPassword,
  updateUserProfile,
} from "@/lib/store-users";

export function toClientConsultation(item: StoredConsultation): ClientConsultation {
  return {
    id: item.id,
    trackingCode: item.trackingCode,
    createdAt: item.createdAt,
    channel: item.channel,
    service: item.service,
    serviceTitle: serviceTitle(item.service),
    lawyerMode: item.lawyerMode,
    lawyerName: item.lawyerVisible ? lawyerLabel(item.lawyerSlug) : undefined,
    lawyerSlug: item.lawyerVisible ? item.lawyerSlug : undefined,
    lawyerPending: !item.lawyerVisible,
    lawyerAccepted: item.status === "in-progress" || item.status === "closed",
    subject: item.subject,
    message: item.message,
    urgency: item.urgency,
    caseStage: item.caseStage,
    city: item.city,
    hasDocuments: item.hasDocuments,
    preferredSlot: item.preferredSlot,
    fullName: item.fullName,
    phone: item.phone,
    email: item.email,
    feeToman: item.feeToman,
    originalFeeToman: item.originalFeeToman,
    discountCode: item.discountCode,
    discountPercent: item.discountPercent,
    paymentStatus: item.paymentStatus,
    status: item.status,
    conversationId: item.conversationId,
    refundedToman: item.refundedToman,
    cancelReason: item.cancelReason,
    documents: item.documents ?? [],
  };
}

function toStoredConsultation(
  row: Consultation & {
    conversation?: { id: string } | null;
    documents?: { id: string; originalName: string; size: number }[];
  },
): StoredConsultation {
  return {
    id: row.id,
    userId: row.userId,
    trackingCode: row.trackingCode,
    createdAt: row.createdAt.toISOString(),
    channel: row.channel as StoredConsultation["channel"],
    service: row.service,
    lawyerMode: row.lawyerMode as StoredConsultation["lawyerMode"],
    lawyerSlug: row.lawyerSlug ?? undefined,
    lawyerVisible: row.lawyerVisible,
    subject: row.subject,
    message: row.message,
    urgency: row.urgency as StoredConsultation["urgency"],
    caseStage: row.caseStage as StoredConsultation["caseStage"],
    city: row.city ?? undefined,
    hasDocuments: row.hasDocuments as StoredConsultation["hasDocuments"],
    preferredSlot: row.preferredSlot ?? undefined,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email ?? undefined,
    consent: true,
    discountCode: row.discountCode ?? undefined,
    feeToman: row.feeToman,
    originalFeeToman: row.originalFeeToman,
    discountPercent: row.discountPercent,
    paymentStatus: row.paymentStatus as PaymentStatus,
    status: row.status as ConsultationStatus,
    conversationId: row.conversation?.id,
    refundedToman: row.refundedToman,
    cancelReason: row.cancelReason ?? undefined,
    documents: row.documents ?? [],
  };
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002",
  );
}

async function nextTrackingCode() {
  const rows = await prisma.consultation.findMany({ select: { trackingCode: true } });
  let max = 0;
  for (const row of rows) {
    const match = /^QEM-\d+-(\d+)$/.exec(row.trackingCode);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `QEM-1405-${String(max + 1).padStart(4, "0")}`;
}

export async function saveConsultation(entry: ConsultationInput, userId: string, documentIds: string[] = []) {
  const quoted = quotePayment(consultBaseFeeToman(entry.service, entry.urgency), entry.discountCode);
  if ("error" in quoted) {
    return { error: quoted.error } as const;
  }

  const payload = {
    userId,
    channel: entry.channel,
    service: entry.service,
    lawyerMode: entry.lawyerMode,
    lawyerSlug: entry.lawyerMode === "chosen" ? entry.lawyerSlug : null,
    lawyerVisible: entry.lawyerMode === "chosen",
    subject: entry.subject,
    message: entry.message,
    urgency: entry.urgency,
    caseStage: entry.caseStage,
    city: entry.city ?? null,
    hasDocuments: documentIds.length > 0 ? "yes" : entry.hasDocuments,
    preferredSlot: entry.preferredSlot ?? null,
    fullName: entry.fullName,
    phone: entry.phone,
    email: entry.email ?? null,
    consent: true,
    discountCode: quoted.discountCode ?? null,
    originalFeeToman: quoted.originalToman,
    feeToman: quoted.feeToman,
    discountPercent: quoted.discountPercent,
    paymentStatus: quoted.feeToman <= 0 ? "free" : "stub-paid",
    status: initialConsultationStatus(entry.lawyerMode, entry.service),
  };

  let row: Consultation | null = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      row = await prisma.consultation.create({
        data: {
          ...payload,
          trackingCode: await nextTrackingCode(),
        },
      });
      break;
    } catch (error) {
      if (!isUniqueConstraintError(error) || attempt === 5) throw error;
    }
  }
  if (!row) {
    return { error: "ثبت درخواست با خطا روبه‌رو شد. کمی بعد دوباره تلاش کنید." } as const;
  }

  const attached = await attachPendingDocuments(userId, row.id, documentIds);
  if (attached.attached > 0 && row.hasDocuments !== "yes") {
    await prisma.consultation.update({ where: { id: row.id }, data: { hasDocuments: "yes" } });
  }

  await prisma.consultDraft.deleteMany({ where: { userId } });
  const withDocs = await prisma.consultation.findUnique({
    where: { id: row.id },
    include: { conversation: { select: { id: true } }, documents: { select: { id: true, originalName: true, size: true } } },
  });
  return toStoredConsultation(withDocs ?? row);
}

export async function getConsultDraft(userId: string) {
  const row = await prisma.consultDraft.findUnique({ where: { userId } });
  if (!row) return null;
  return parseConsultDraftState(row.payload) ?? null;
}

export async function saveConsultDraft(userId: string, input: unknown) {
  const parsed = parseConsultDraftState(input);
  const state: ConsultDraftState = parsed ?? {
    step: 1,
    draft: emptyConsultDraft(),
    updatedAt: new Date().toISOString(),
  };
  const stored = { ...state, updatedAt: new Date().toISOString() };
  await prisma.consultDraft.upsert({
    where: { userId },
    create: {
      userId,
      payload: stored as Prisma.InputJsonValue,
    },
    update: {
      payload: stored as Prisma.InputJsonValue,
    },
  });
  return stored;
}

export async function clearConsultDraft(userId: string) {
  await prisma.consultDraft.deleteMany({ where: { userId } });
}

export async function listUserConsultations(userId: string) {
  const rows = await prisma.consultation.findMany({
    where: { userId },
    include: {
      conversation: { select: { id: true } },
      documents: { select: { id: true, originalName: true, size: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toStoredConsultation);
}

export async function getUserConsultation(userId: string, trackingCode: string) {
  const row = await prisma.consultation.findFirst({
    where: { userId, trackingCode },
    include: {
      conversation: { select: { id: true } },
      documents: { select: { id: true, originalName: true, size: true } },
    },
  });
  return row ? toStoredConsultation(row) : undefined;
}

export async function deleteCancelledConsultation(userId: string, trackingCode: string) {
  const row = await prisma.consultation.findFirst({
    where: { userId, trackingCode },
    include: { documents: { select: { storedName: true } } },
  });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status !== "cancelled") {
    return { error: "فقط درخواست لغو‌شده را می‌توانید از فهرست حذف کنید." as const };
  }

  await prisma.consultation.delete({ where: { id: row.id } });
  await removeStoredFiles(row.documents.map((item) => item.storedName));
  return { ok: true as const };
}
