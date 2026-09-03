import type { Case, CaseEvent, User } from "@/generated/prisma";

import {
  caseStageMeta,
  caseStatusMeta,
  type CaseEventKind,
  type CaseStage,
  type CaseStatus,
  type ClientCase,
  type ClientCaseEvent,
} from "@/lib/case-model";
import { lawyerLabel } from "@/lib/consult";
import { prisma } from "@/lib/db";

type CaseRow = Case & {
  user?: Pick<User, "fullName" | "phone"> | null;
  consultation?: { trackingCode: string } | null;
  events?: CaseEvent[];
  _count?: { events: number };
};

const caseInclude = {
  user: { select: { fullName: true, phone: true } },
  consultation: { select: { trackingCode: true } },
  _count: { select: { events: true } },
} as const;

export async function nextCaseNumber() {
  const rows = await prisma.case.findMany({ select: { caseNumber: true } });
  let max = 0;
  for (const row of rows) {
    const match = /^PRN-\d+-(\d+)$/.exec(row.caseNumber);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `PRN-1405-${String(max + 1).padStart(4, "0")}`;
}

export async function createCase(input: {
  lawyerSlug: string;
  conversationId?: string;
  userId?: string;
  title: string;
  summary: string;
  stage: CaseStage;
  authority?: string;
  courtBranch?: string;
  fileNumber?: string;
  feeToman: number;
  nextActionAt?: Date;
  nextActionNote?: string;
}) {
  const title = input.title.trim();
  const summary = input.summary.trim();
  if (title.length < 4) return { error: "عنوان پرونده را کامل‌تر بنویسید." as const };
  if (summary.length < 20) return { error: "شرح پرونده باید حداقل ۲۰ نویسه باشد." as const };
  if (input.feeToman < 0 || input.feeToman > 5_000_000_000) {
    return { error: "مبلغ حق‌الوکاله معتبر نیست." as const };
  }

  let userId = input.userId;
  let consultationId: string | undefined;

  if (input.conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: input.conversationId, lawyerSlug: input.lawyerSlug },
      include: { consultation: { select: { id: true, case: { select: { id: true } } } } },
    });
    if (!conversation) return { error: "گفتگو پیدا نشد." as const };
    if (conversation.consultation.case) {
      return { error: "برای این درخواست قبلاً پرونده تشکیل شده است." as const };
    }
    userId = conversation.userId;
    consultationId = conversation.consultation.id;
  }

  if (!userId) return { error: "موکل پرونده مشخص نیست." as const };

  const created = await prisma.case.create({
    data: {
      caseNumber: await nextCaseNumber(),
      consultationId,
      userId,
      lawyerSlug: input.lawyerSlug,
      title,
      summary,
      stage: input.stage,
      status: "proposed",
      authority: input.authority?.trim() || null,
      courtBranch: input.courtBranch?.trim() || null,
      fileNumber: input.fileNumber?.trim() || null,
      feeToman: input.feeToman,
      nextActionAt: input.nextActionAt ?? null,
      nextActionNote: input.nextActionNote?.trim()?.slice(0, 300) || null,
      events: {
        create: {
          kind: "status",
          title: "پیشنهاد تشکیل پرونده ثبت شد",
          body: `مرحله: ${caseStageMeta[input.stage]}`,
          authorRole: "lawyer",
          visibleToClient: true,
        },
      },
    },
  });

  if (input.conversationId) {
    await prisma.message.create({
      data: {
        conversationId: input.conversationId,
        authorRole: "system",
        body: `وکیل تشکیل پرونده «${title}» را پیشنهاد داد. جزئیات و تأیید آن در بخش پرونده‌ها است.`,
      },
    });
  }

  return { ok: true as const, caseId: created.id, caseNumber: created.caseNumber };
}

export async function listLawyerCases(lawyerSlug: string, status?: CaseStatus) {
  const rows = await prisma.case.findMany({
    where: { lawyerSlug, ...(status ? { status } : {}) },
    include: caseInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return rows.map((row) => toClientCase(row, "lawyer"));
}

export async function listUserCases(userId: string) {
  const rows = await prisma.case.findMany({
    where: { userId },
    include: caseInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => toClientCase(row, "client"));
}

export async function getLawyerCase(lawyerSlug: string, caseId: string) {
  const row = await prisma.case.findFirst({
    where: { id: caseId, lawyerSlug },
    include: { ...caseInclude, events: { orderBy: { createdAt: "desc" } } },
  });
  return row ? toClientCase(row, "lawyer") : null;
}

export async function getUserCase(userId: string, caseId: string) {
  const row = await prisma.case.findFirst({
    where: { id: caseId, userId },
    include: { ...caseInclude, events: { orderBy: { createdAt: "desc" } } },
  });
  return row ? toClientCase(row, "client") : null;
}

export async function updateCase(
  lawyerSlug: string,
  caseId: string,
  patch: {
    status?: CaseStatus;
    stage?: CaseStage;
    authority?: string;
    courtBranch?: string;
    fileNumber?: string;
    feeToman?: number;
    paidToman?: number;
    nextActionAt?: Date | null;
    nextActionNote?: string;
    closeNote?: string;
  },
) {
  const row = await prisma.case.findFirst({ where: { id: caseId, lawyerSlug } });
  if (!row) return { error: "پرونده پیدا نشد." as const };
  if (patch.status === "proposed" && row.status !== "proposed") {
    return { error: "بازگشت به مرحله پیشنهاد ممکن نیست." as const };
  }
  if (row.status === "proposed" && patch.status && patch.status !== "declined") {
    return { error: "تا تأیید موکل، وضعیت پرونده تغییر نمی‌کند." as const };
  }

  const data: Record<string, unknown> = {};
  if (patch.stage) data.stage = patch.stage;
  if (patch.authority !== undefined) data.authority = patch.authority.trim() || null;
  if (patch.courtBranch !== undefined) data.courtBranch = patch.courtBranch.trim() || null;
  if (patch.fileNumber !== undefined) data.fileNumber = patch.fileNumber.trim() || null;
  if (patch.feeToman !== undefined) data.feeToman = Math.max(0, Math.round(patch.feeToman));
  if (patch.paidToman !== undefined) data.paidToman = Math.max(0, Math.round(patch.paidToman));
  if (patch.nextActionAt !== undefined) data.nextActionAt = patch.nextActionAt;
  if (patch.nextActionNote !== undefined) {
    data.nextActionNote = patch.nextActionNote.trim().slice(0, 300) || null;
  }
  if (patch.status) {
    data.status = patch.status;
    if (patch.status === "closed") {
      data.closedAt = new Date();
      data.closeNote = patch.closeNote?.trim() || row.closeNote;
    }
    if (patch.status === "declined") data.declinedAt = new Date();
  }

  const updated = await prisma.case.update({ where: { id: row.id }, data });

  const notes: string[] = [];
  if (patch.status && patch.status !== row.status) {
    notes.push(`وضعیت به «${caseStatusMeta[patch.status].title}» تغییر کرد`);
  }
  if (patch.stage && patch.stage !== row.stage) {
    notes.push(`مرحله به «${caseStageMeta[patch.stage]}» تغییر کرد`);
  }
  if (notes.length) {
    await prisma.caseEvent.create({
      data: {
        caseId: row.id,
        kind: "status",
        title: notes.join(" و "),
        body: patch.status === "closed" ? patch.closeNote?.trim() || null : null,
        authorRole: "lawyer",
        visibleToClient: true,
      },
    });
  }
  if (
    patch.nextActionAt !== undefined &&
    patch.nextActionAt &&
    patch.nextActionAt.getTime() !== row.nextActionAt?.getTime()
  ) {
    await prisma.caseEvent.create({
      data: {
        caseId: row.id,
        kind: "hearing",
        title: patch.nextActionNote?.trim() || "اقدام بعدی پرونده",
        happensAt: patch.nextActionAt,
        authorRole: "lawyer",
        visibleToClient: true,
      },
    });
  }

  return { ok: true as const, status: updated.status as CaseStatus };
}

export async function addCaseEvent(input: {
  lawyerSlug: string;
  caseId: string;
  kind: CaseEventKind;
  title: string;
  body?: string;
  happensAt?: Date;
  visibleToClient: boolean;
}) {
  const row = await prisma.case.findFirst({ where: { id: input.caseId, lawyerSlug: input.lawyerSlug } });
  if (!row) return { error: "پرونده پیدا نشد." as const };
  const title = input.title.trim();
  if (title.length < 3) return { error: "عنوان رویداد را کامل‌تر بنویسید." as const };

  await prisma.caseEvent.create({
    data: {
      caseId: row.id,
      kind: input.kind,
      title: title.slice(0, 160),
      body: input.body?.trim()?.slice(0, 4000) || null,
      happensAt: input.happensAt ?? null,
      authorRole: "lawyer",
      visibleToClient: input.visibleToClient,
    },
  });
  return { ok: true as const };
}

export async function respondToCase(
  userId: string,
  caseId: string,
  action: "accept" | "decline",
  note?: string,
) {
  const row = await prisma.case.findFirst({ where: { id: caseId, userId } });
  if (!row) return { error: "پرونده پیدا نشد." as const };
  if (row.status !== "proposed") {
    return { error: "این پیشنهاد قبلاً بررسی شده است." as const };
  }

  const clientNote = note?.trim()?.slice(0, 1000) || null;
  await prisma.case.update({
    where: { id: row.id },
    data:
      action === "accept"
        ? { status: "active", acceptedAt: new Date(), clientNote }
        : { status: "declined", declinedAt: new Date(), clientNote },
  });
  await prisma.caseEvent.create({
    data: {
      caseId: row.id,
      kind: "status",
      title: action === "accept" ? "موکل تشکیل پرونده را پذیرفت" : "موکل پیشنهاد پرونده را نپذیرفت",
      body: clientNote,
      authorRole: "client",
      visibleToClient: true,
    },
  });
  return { ok: true as const };
}

export async function countLawyerCases(lawyerSlug: string) {
  const rows = await prisma.case.groupBy({
    by: ["status"],
    where: { lawyerSlug },
    _count: { _all: true },
    _sum: { feeToman: true, paidToman: true },
  });
  const byStatus = new Map(rows.map((row) => [row.status as CaseStatus, row]));
  const count = (status: CaseStatus) => byStatus.get(status)?._count._all ?? 0;
  return {
    proposed: count("proposed"),
    active: count("active"),
    onHold: count("on-hold"),
    closed: count("closed"),
    declined: count("declined"),
    open: count("proposed") + count("active") + count("on-hold"),
    feeTotal: rows.reduce((sum, row) => sum + (row._sum.feeToman ?? 0), 0),
    paidTotal: rows.reduce((sum, row) => sum + (row._sum.paidToman ?? 0), 0),
  };
}

export async function listUpcomingCaseActions(lawyerSlug: string, take = 6) {
  const rows = await prisma.case.findMany({
    where: {
      lawyerSlug,
      status: { in: ["active", "on-hold"] },
      nextActionAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    include: caseInclude,
    orderBy: { nextActionAt: "asc" },
    take,
  });
  return rows.map((row) => toClientCase(row, "lawyer"));
}

function toClientEvent(row: CaseEvent): ClientCaseEvent {
  return {
    id: row.id,
    kind: row.kind as CaseEventKind,
    title: row.title,
    body: row.body ?? undefined,
    happensAt: row.happensAt?.toISOString(),
    authorRole: row.authorRole as ClientCaseEvent["authorRole"],
    visibleToClient: row.visibleToClient,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toClientCase(row: CaseRow, audience: "lawyer" | "client"): ClientCase {
  const events = (row.events ?? [])
    .filter((event) => audience === "lawyer" || event.visibleToClient)
    .map(toClientEvent);

  return {
    id: row.id,
    caseNumber: row.caseNumber,
    title: row.title,
    summary: row.summary,
    status: row.status as CaseStatus,
    stage: row.stage as CaseStage,
    authority: row.authority ?? undefined,
    courtBranch: row.courtBranch ?? undefined,
    fileNumber: row.fileNumber ?? undefined,
    feeToman: row.feeToman,
    paidToman: row.paidToman,
    nextActionAt: row.nextActionAt?.toISOString(),
    nextActionNote: row.nextActionNote ?? undefined,
    clientNote: row.clientNote ?? undefined,
    closeNote: row.closeNote ?? undefined,
    lawyerSlug: row.lawyerSlug,
    lawyerName: lawyerLabel(row.lawyerSlug) ?? "وکیل",
    clientName: row.user?.fullName ?? "موکل",
    clientPhone: audience === "lawyer" ? row.user?.phone : undefined,
    trackingCode: row.consultation?.trackingCode,
    createdAt: row.createdAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString(),
    declinedAt: row.declinedAt?.toISOString(),
    closedAt: row.closedAt?.toISOString(),
    events,
    eventCount: row._count?.events ?? events.length,
  };
}
