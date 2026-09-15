import "server-only";

import { Prisma } from "@/generated/prisma";

import { createCase } from "@/lib/cases";
import { acceptConsultation, closeConversation } from "@/lib/conversations";
import { catalogItemTitle } from "@/lib/legal-catalog";
import { prisma } from "@/lib/db";
import { createDocumentRequest } from "@/lib/document-request";
import { removeStoredFiles } from "@/lib/consult-documents";
import { parseCaseStage, type CaseStage } from "@/lib/case-model";

export const workProposalKinds = [
  "result",
  "open-chat",
  "form-case",
  "new-work",
  "close",
  "document-request",
] as const;
export type WorkProposalKind = (typeof workProposalKinds)[number];

export const workProposalStatuses = ["pending", "approved", "rejected"] as const;
export type WorkProposalStatus = (typeof workProposalStatuses)[number];

export const workProposalKindMeta: Record<WorkProposalKind, string> = {
  result: "ثبت نتیجه یا تغییر",
  "open-chat": "شروع گفتگو با موکل",
  "form-case": "تشکیل پرونده",
  "new-work": "کار جدید در پرونده",
  close: "پایان پرونده / درخواست",
  "document-request": "درخواست مدرک از موکل",
};

function asKind(value: string): WorkProposalKind | null {
  return (workProposalKinds as readonly string[]).includes(value) ? (value as WorkProposalKind) : null;
}

export type ClientProposal = {
  id: string;
  kind: WorkProposalKind;
  kindLabel: string;
  status: WorkProposalStatus;
  title: string;
  body: string;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  proposedByLawyerSlug?: string;
};

function toClientProposal(row: {
  id: string;
  kind: string;
  status: string;
  title: string;
  body: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewNote: string | null;
  proposedByLawyerSlug: string | null;
}): ClientProposal {
  const kind = (asKind(row.kind) ?? "result") as WorkProposalKind;
  return {
    id: row.id,
    kind,
    kindLabel: workProposalKindMeta[kind],
    status: row.status as WorkProposalStatus,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString(),
    reviewNote: row.reviewNote ?? undefined,
    proposedByLawyerSlug: row.proposedByLawyerSlug ?? undefined,
  };
}

export async function listPendingProposals(take = 80) {
  const rows = await prisma.workProposal.findMany({
    where: { status: "pending" },
    include: {
      consultation: {
        select: { trackingCode: true, subject: true, fullName: true, lawyerSlug: true, service: true },
      },
    },
    orderBy: { createdAt: "asc" },
    take,
  });
  return rows.map((row) => ({
    ...toClientProposal(row),
    trackingCode: row.consultation.trackingCode,
    subject: row.consultation.subject,
    clientName: row.consultation.fullName,
    lawyerSlug: row.consultation.lawyerSlug,
    serviceTitle: catalogItemTitle(row.consultation.service),
  }));
}

export async function listConsultationProposals(consultationId: string) {
  const rows = await prisma.workProposal.findMany({
    where: { consultationId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toClientProposal);
}

export async function listApprovedResultsForUser(consultationId: string) {
  const rows = await prisma.workProposal.findMany({
    where: { consultationId, status: "approved", kind: { in: ["result", "new-work", "close"] } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toClientProposal);
}

async function requireAssignedLawyer(trackingCode: string, lawyerSlug: string) {
  const row = await prisma.consultation.findUnique({
    where: { trackingCode },
    include: { conversation: true, case: true },
  });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.lawyerSlug !== lawyerSlug) {
    return { error: "این درخواست به شما منتسب نشده است." as const };
  }
  if (row.status === "awaiting-operator" || !row.lawyerSlug) {
    return { error: "این درخواست هنوز توسط مدیر تخصیص داده نشده است." as const };
  }
  if (row.status === "cancelled") return { error: "این درخواست لغو شده است." as const };
  return { row };
}

export async function createLawyerProposal(input: {
  trackingCode: string;
  lawyerSlug: string;
  kind: WorkProposalKind;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}) {
  const found = await requireAssignedLawyer(input.trackingCode, input.lawyerSlug);
  if ("error" in found) return found;
  const title = input.title.trim().slice(0, 180);
  const body = input.body.trim().slice(0, 8000);
  if (title.length < 3) return { error: "عنوان را کامل‌تر بنویسید." as const };
  if (body.length < 8) return { error: "شرح اقدام باید واضح باشد." as const };

  const pendingSame = await prisma.workProposal.findFirst({
    where: {
      consultationId: found.row.id,
      kind: input.kind,
      status: "pending",
    },
  });
  if (pendingSame && input.kind !== "result" && input.kind !== "new-work") {
    return { error: "یک درخواست مشابه در انتظار تأیید مدیر است." as const };
  }

  const created = await prisma.workProposal.create({
    data: {
      consultationId: found.row.id,
      caseId: found.row.case?.id ?? null,
      kind: input.kind,
      title,
      body,
      payload: (input.payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      proposedByRole: "lawyer",
      proposedByLawyerSlug: input.lawyerSlug,
    },
  });
  return { ok: true as const, id: created.id };
}

export async function assignAndOptionallyStart(input: {
  trackingCode: string;
  lawyerSlug: string;
  startChat?: boolean;
  staffUserId?: string;
}) {
  const lawyer = await prisma.user.findFirst({
    where: { lawyerSlug: input.lawyerSlug, role: "lawyer", active: true },
  });
  if (!lawyer) return { error: "حساب فعال برای این وکیل وجود ندارد." as const };

  const row = await prisma.consultation.findUnique({ where: { trackingCode: input.trackingCode } });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status === "cancelled" || row.status === "closed") {
    return { error: "این درخواست قابل انتساب نیست." as const };
  }

  await prisma.consultation.update({
    where: { id: row.id },
    data: {
      lawyerSlug: input.lawyerSlug,
      lawyerMode: "assign",
      lawyerVisible: true,
      status: input.startChat ? row.status : "assigned",
      assignedAt: new Date(),
    },
  });

  if (input.startChat) {
    const started = await acceptConsultation(input.lawyerSlug, input.trackingCode);
    if ("error" in started) return started;
    await prisma.consultation.update({
      where: { id: row.id },
      data: { status: "in-progress", lawyerVisible: true, lawyerSlug: input.lawyerSlug },
    });
    return { ok: true as const, conversationId: started.conversationId };
  }

  return { ok: true as const };
}

export async function staffSetPayment(input: {
  trackingCode: string;
  feeToman?: number;
  paymentStatus?: "unpaid" | "requested" | "paid" | "waived" | "free";
  note?: string;
}) {
  const row = await prisma.consultation.findUnique({ where: { trackingCode: input.trackingCode } });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  const feeToman = input.feeToman ?? row.feeToman;
  if (feeToman < 0 || feeToman > 5_000_000_000) return { error: "مبلغ نامعتبر است." as const };

  await prisma.consultation.update({
    where: { id: row.id },
    data: {
      feeToman,
      originalFeeToman: feeToman,
      paymentStatus: input.paymentStatus ?? row.paymentStatus,
      paymentNote: input.note?.trim().slice(0, 400) || row.paymentNote,
    },
  });
  return { ok: true as const };
}

export async function purgeConsultationDocuments(consultationId: string) {
  const docs = await prisma.consultationDocument.findMany({
    where: { consultationId },
    select: { id: true, storedName: true },
  });
  if (docs.length === 0) {
    await prisma.consultation.update({
      where: { id: consultationId },
      data: { documentsPurgedAt: new Date(), hasDocuments: "no" },
    });
    return { deleted: 0 };
  }
  await prisma.consultationDocument.deleteMany({ where: { consultationId } });
  await removeStoredFiles(docs.map((item) => item.storedName));
  await prisma.consultation.update({
    where: { id: consultationId },
    data: { documentsPurgedAt: new Date(), hasDocuments: "no" },
  });
  return { deleted: docs.length };
}

export async function staffCloseAndPurge(input: {
  trackingCode: string;
  note?: string;
  staffUserId?: string;
}) {
  const row = await prisma.consultation.findUnique({
    where: { trackingCode: input.trackingCode },
    include: { conversation: true, case: true },
  });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status === "cancelled") return { error: "این درخواست قبلاً لغو شده است." as const };

  if (row.conversation && row.lawyerSlug) {
    await closeConversation(row.lawyerSlug, row.conversation.id, input.note);
  } else {
    await prisma.consultation.update({
      where: { id: row.id },
      data: { status: "closed" },
    });
  }

  if (row.case && row.case.status !== "closed") {
    await prisma.case.update({
      where: { id: row.case.id },
      data: {
        status: "closed",
        closedAt: new Date(),
        closeNote: input.note?.trim().slice(0, 2000) || "پایان پرونده با تأیید مدیر",
      },
    });
  }

  const purged = await purgeConsultationDocuments(row.id);
  if (input.note?.trim()) {
    await prisma.consultation.update({
      where: { id: row.id },
      data: { clientVisibleResult: input.note.trim().slice(0, 4000) },
    });
  }
  return { ok: true as const, deletedDocuments: purged.deleted };
}

export async function reviewProposal(input: {
  proposalId: string;
  staffUserId: string;
  decision: "approve" | "reject";
  note?: string;
}) {
  const proposal = await prisma.workProposal.findUnique({
    where: { id: input.proposalId },
    include: { consultation: { include: { conversation: true, case: true } } },
  });
  if (!proposal) return { error: "پیشنهاد پیدا نشد." as const };
  if (proposal.status !== "pending") return { error: "این مورد قبلاً بررسی شده است." as const };

  if (input.decision === "reject") {
    await prisma.workProposal.update({
      where: { id: proposal.id },
      data: {
        status: "rejected",
        reviewedByUserId: input.staffUserId,
        reviewedAt: new Date(),
        reviewNote: input.note?.trim().slice(0, 2000) || "رد شده توسط مدیر",
      },
    });
    return { ok: true as const, status: "rejected" as const };
  }

  const kind = asKind(proposal.kind);
  if (!kind) return { error: "نوع پیشنهاد نامعتبر است." as const };
  const consultation = proposal.consultation;
  const payload = (proposal.payload ?? {}) as Record<string, unknown>;

  if (kind === "open-chat") {
    if (!consultation.lawyerSlug) return { error: "ابتدا وکیل را تخصیص دهید." as const };
    if (!consultation.conversation) {
      const started = await acceptConsultation(consultation.lawyerSlug, consultation.trackingCode);
      if ("error" in started) return started;
    } else {
      await prisma.consultation.update({
        where: { id: consultation.id },
        data: { status: "in-progress" },
      });
    }
  }

  if (kind === "result" || kind === "new-work") {
    const text = proposal.body;
    await prisma.consultation.update({
      where: { id: consultation.id },
      data: { clientVisibleResult: text.slice(0, 4000) },
    });
    if (consultation.conversation) {
      await prisma.message.create({
        data: {
          conversationId: consultation.conversation.id,
          authorRole: "system",
          body: `نتیجه تأییدشده مدیر: ${proposal.title}\n${text}`,
        },
      });
    }
    if (consultation.case) {
      await prisma.caseEvent.create({
        data: {
          caseId: consultation.case.id,
          kind: "status",
          title: proposal.title,
          body: text,
          authorRole: "admin",
          visibleToClient: true,
        },
      });
    }
  }

  if (kind === "form-case") {
    if (!consultation.lawyerSlug) return { error: "وکیل منتسب نشده است." as const };
    const stage = parseCaseStage(String(payload.stage ?? "review")) ?? ("review" as CaseStage);
    const created = await createCase({
      lawyerSlug: consultation.lawyerSlug,
      conversationId: consultation.conversation?.id,
      userId: consultation.userId,
      title: String(payload.title ?? proposal.title),
      summary: String(payload.summary ?? proposal.body),
      stage,
      authority: typeof payload.authority === "string" ? payload.authority : undefined,
      courtBranch: typeof payload.courtBranch === "string" ? payload.courtBranch : undefined,
      fileNumber: typeof payload.fileNumber === "string" ? payload.fileNumber : undefined,
      feeToman: Number(payload.feeToman ?? 0) || 1,
      nextActionNote: typeof payload.nextActionNote === "string" ? payload.nextActionNote : undefined,
    });
    if ("error" in created) return created;
    await prisma.case.update({
      where: { id: created.caseId },
      data: {
        status: "active",
        acceptedAt: new Date(),
        consultationId: consultation.id,
      },
    });
  }

  if (kind === "document-request") {
    if (!consultation.conversation || !consultation.lawyerSlug) {
      return { error: "ابتدا گفتگو باید توسط مدیر باز شود." as const };
    }
    const titles = Array.isArray(payload.titles)
      ? payload.titles.filter((item): item is string => typeof item === "string")
      : proposal.body.split("\n").map((line) => line.trim()).filter(Boolean);
    const created = await createDocumentRequest({
      lawyerSlug: consultation.lawyerSlug,
      conversationId: consultation.conversation.id,
      titles,
      note: proposal.title,
    });
    if ("error" in created) return created;
  }

  if (kind === "close") {
    const closed = await staffCloseAndPurge({
      trackingCode: consultation.trackingCode,
      note: proposal.body,
      staffUserId: input.staffUserId,
    });
    if ("error" in closed) return closed;
  }

  await prisma.workProposal.update({
    where: { id: proposal.id },
    data: {
      status: "approved",
      reviewedByUserId: input.staffUserId,
      reviewedAt: new Date(),
      reviewNote: input.note?.trim().slice(0, 2000) || "تأیید شد",
    },
  });

  return { ok: true as const, status: "approved" as const };
}

export async function listLawyerAssignments(lawyerSlug: string) {
  const rows = await prisma.consultation.findMany({
    where: {
      lawyerSlug,
      status: { in: ["assigned", "in-progress", "cancel-requested"] },
    },
    include: {
      user: { select: { fullName: true, phone: true } },
      documents: { select: { id: true, originalName: true, size: true } },
      conversation: { select: { id: true } },
      proposals: {
        where: { status: "pending" },
        select: { id: true, kind: true, title: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  return rows.map((row) => ({
    trackingCode: row.trackingCode,
    subject: row.subject,
    message: row.message,
    service: row.service,
    serviceTitle: catalogItemTitle(row.service),
    status: row.status,
    channel: row.channel,
    city: row.city,
    feeToman: row.feeToman,
    paymentStatus: row.paymentStatus,
    clientName: row.user.fullName,
    clientPhone: row.user.phone,
    createdAt: row.createdAt.toISOString(),
    assignedAt: row.assignedAt?.toISOString() ?? null,
    conversationId: row.conversation?.id,
    pendingProposals: row.proposals.length,
    documents: row.documents,
  }));
}
