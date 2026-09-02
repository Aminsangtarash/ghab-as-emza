import type { Consultation, User } from "@/generated/prisma";
import { Prisma } from "@/generated/prisma";

import {
  initialConsultationStatus,
  lawyerLabel,
  serviceFeeToman,
  serviceTitle,
  type ConsultationStatus,
} from "@/lib/consult";
import {
  emptyConsultDraft,
  parseConsultDraftState,
  type ConsultDraftState,
} from "@/lib/consult-draft";
import { prisma } from "@/lib/db";
import { quotePayment } from "@/lib/promos";
import type { ConsultationInput } from "@/lib/validations";

export type PublicUser = {
  id: string;
  fullName: string;
  phone: string;
};

export type StoredUser = PublicUser & {
  passwordHash: string;
  createdAt: string;
};

export type PaymentStatus = "free" | "stub-paid";

export type StoredConsultation = ConsultationInput & {
  id: string;
  userId: string;
  trackingCode: string;
  createdAt: string;
  lawyerVisible: boolean;
  feeToman: number;
  originalFeeToman: number;
  discountCode?: string;
  discountPercent: number;
  paymentStatus: PaymentStatus;
  status: ConsultationStatus;
};

export type ClientConsultation = {
  id: string;
  trackingCode: string;
  createdAt: string;
  channel: StoredConsultation["channel"];
  service: string;
  serviceTitle: string;
  lawyerMode: StoredConsultation["lawyerMode"];
  lawyerName?: string;
  lawyerPending: boolean;
  subject: string;
  message: string;
  urgency: StoredConsultation["urgency"];
  caseStage: StoredConsultation["caseStage"];
  city?: string;
  hasDocuments: StoredConsultation["hasDocuments"];
  preferredSlot?: string;
  fullName: string;
  phone: string;
  email?: string;
  feeToman: number;
  originalFeeToman: number;
  discountCode?: string;
  discountPercent: number;
  paymentStatus: PaymentStatus;
  status: ConsultationStatus;
};

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
    lawyerPending: !item.lawyerVisible,
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
  };
}

function toPublicUser(user: Pick<User, "id" | "fullName" | "phone">): PublicUser {
  return { id: user.id, fullName: user.fullName, phone: user.phone };
}

function toStoredUser(user: User): StoredUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
  };
}

function toStoredConsultation(row: Consultation): StoredConsultation {
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
  };
}

export async function createUser(input: { fullName: string; phone: string; passwordHash: string }) {
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
      passwordHash: input.passwordHash,
    },
  });
  return toStoredUser(user);
}

export async function findUserByPhone(phone: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  return user ? toStoredUser(user) : undefined;
}

export async function createSession(token: string, userId: string) {
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getUserBySession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }
  return toPublicUser(session.user);
}

export async function saveConsultation(entry: ConsultationInput, userId: string) {
  const quoted = quotePayment(serviceFeeToman(entry.service), entry.discountCode);
  if ("error" in quoted) {
    return { error: quoted.error } as const;
  }

  const count = await prisma.consultation.count();
  const serial = String(count + 1).padStart(4, "0");
  const trackingCode = `QEM-1405-${serial}`;

  const row = await prisma.consultation.create({
    data: {
      userId,
      trackingCode,
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
      hasDocuments: entry.hasDocuments,
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
      status: initialConsultationStatus(entry.lawyerMode),
    },
  });

  await prisma.consultDraft.deleteMany({ where: { userId } });
  return toStoredConsultation(row);
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
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toStoredConsultation);
}

export async function getUserConsultation(userId: string, trackingCode: string) {
  const row = await prisma.consultation.findFirst({
    where: { userId, trackingCode },
  });
  return row ? toStoredConsultation(row) : undefined;
}
