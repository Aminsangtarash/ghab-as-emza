import { countUpcomingAppointments } from "@/lib/appointments";
import { countLawyerCases } from "@/lib/cases";
import { serviceTitle } from "@/lib/consult";
import { prisma } from "@/lib/db";

export type LawyerStats = {
  queue: number;
  activeChats: number;
  awaitingReply: number;
  closedChats: number;
  cases: { proposed: number; active: number; onHold: number; closed: number; open: number };
  appointments: { today: number; upcoming: number };
  ratings: { count: number; average: number };
  earnings: { month: number; total: number; caseFees: number };
  clients: number;
};

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getLawyerStats(lawyerSlug: string): Promise<LawyerStats> {
  const [
    queue,
    activeChats,
    closedChats,
    cases,
    appointments,
    ratingAgg,
    monthFees,
    totalFees,
    clients,
    needingReply,
  ] = await Promise.all([
    prisma.consultation.count({
      where: {
        status: { in: ["awaiting-lawyer", "awaiting-operator"] },
        OR: [{ lawyerSlug }, { lawyerSlug: null, lawyerMode: "assign" }],
      },
    }),
    prisma.conversation.count({ where: { lawyerSlug, closedAt: null } }),
    prisma.conversation.count({ where: { lawyerSlug, closedAt: { not: null } } }),
    countLawyerCases(lawyerSlug),
    countUpcomingAppointments(lawyerSlug),
    prisma.rating.aggregate({
      where: { conversation: { lawyerSlug } },
      _avg: { score: true },
      _count: { _all: true },
    }),
    prisma.consultation.aggregate({
      where: {
        lawyerSlug,
        status: { in: ["in-progress", "closed"] },
        createdAt: { gte: startOfMonth() },
      },
      _sum: { feeToman: true },
    }),
    prisma.consultation.aggregate({
      where: { lawyerSlug, status: { in: ["in-progress", "closed"] } },
      _sum: { feeToman: true },
    }),
    prisma.consultation.findMany({
      where: { lawyerSlug },
      select: { userId: true },
      distinct: ["userId"],
    }),
    listConversationsNeedingReply(lawyerSlug),
  ]);

  return {
    queue,
    activeChats,
    awaitingReply: needingReply.length,
    closedChats,
    cases: {
      proposed: cases.proposed,
      active: cases.active,
      onHold: cases.onHold,
      closed: cases.closed,
      open: cases.open,
    },
    appointments,
    ratings: {
      count: ratingAgg._count._all,
      average: Number((ratingAgg._avg.score ?? 0).toFixed(1)),
    },
    earnings: {
      month: monthFees._sum.feeToman ?? 0,
      total: totalFees._sum.feeToman ?? 0,
      caseFees: cases.paidTotal,
    },
    clients: clients.length,
  };
}

export type ReplyNeeded = {
  conversationId: string;
  trackingCode: string;
  subject: string;
  channel: string;
  clientName: string;
  lastMessage: string;
  lastAt: string;
};

export async function listConversationsNeedingReply(lawyerSlug: string, take = 20) {
  const rows = await prisma.conversation.findMany({
    where: { lawyerSlug, closedAt: null },
    include: {
      consultation: { select: { trackingCode: true, subject: true, channel: true } },
      user: { select: { fullName: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return rows
    .filter((row) => row.messages[0]?.authorRole === "user")
    .slice(0, take)
    .map((row) => ({
      conversationId: row.id,
      trackingCode: row.consultation.trackingCode,
      subject: row.consultation.subject,
      channel: row.consultation.channel,
      clientName: row.user.fullName,
      lastMessage: row.messages[0]?.body ?? "",
      lastAt: (row.messages[0]?.createdAt ?? row.createdAt).toISOString(),
    })) satisfies ReplyNeeded[];
}

export type LawyerClient = {
  userId: string;
  fullName: string;
  phone: string;
  requests: number;
  openRequests: number;
  cases: number;
  paidToman: number;
  lastActivity: string;
  firstActivity: string;
};

export async function listLawyerClients(lawyerSlug: string): Promise<LawyerClient[]> {
  const [consultations, cases] = await Promise.all([
    prisma.consultation.findMany({
      where: { lawyerSlug },
      select: {
        userId: true,
        status: true,
        feeToman: true,
        paymentStatus: true,
        createdAt: true,
        user: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.case.findMany({ where: { lawyerSlug }, select: { userId: true } }),
  ]);

  const caseCount = new Map<string, number>();
  for (const row of cases) {
    caseCount.set(row.userId, (caseCount.get(row.userId) ?? 0) + 1);
  }

  const map = new Map<string, LawyerClient>();
  for (const row of consultations) {
    const current = map.get(row.userId) ?? {
      userId: row.userId,
      fullName: row.user.fullName,
      phone: row.user.phone,
      requests: 0,
      openRequests: 0,
      cases: caseCount.get(row.userId) ?? 0,
      paidToman: 0,
      lastActivity: row.createdAt.toISOString(),
      firstActivity: row.createdAt.toISOString(),
    };
    current.requests += 1;
    if (row.status === "in-progress" || row.status === "awaiting-lawyer") current.openRequests += 1;
    if (row.paymentStatus === "stub-paid") current.paidToman += row.feeToman;
    const iso = row.createdAt.toISOString();
    if (iso > current.lastActivity) current.lastActivity = iso;
    if (iso < current.firstActivity) current.firstActivity = iso;
    map.set(row.userId, current);
  }

  return [...map.values()].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
}

export type LawyerRating = {
  id: string;
  score: number;
  comment?: string;
  createdAt: string;
  clientName: string;
  subject: string;
  trackingCode: string;
  conversationId: string;
};

export async function listLawyerRatings(lawyerSlug: string, take = 50): Promise<LawyerRating[]> {
  const rows = await prisma.rating.findMany({
    where: { conversation: { lawyerSlug } },
    include: {
      user: { select: { fullName: true } },
      conversation: {
        select: { id: true, consultation: { select: { subject: true, trackingCode: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return rows.map((row) => ({
    id: row.id,
    score: row.score,
    comment: row.comment ?? undefined,
    createdAt: row.createdAt.toISOString(),
    clientName: row.user.fullName,
    subject: row.conversation.consultation.subject,
    trackingCode: row.conversation.consultation.trackingCode,
    conversationId: row.conversation.id,
  }));
}

export type EarningRow = {
  trackingCode: string;
  subject: string;
  service: string;
  status: string;
  feeToman: number;
  paymentStatus: string;
  createdAt: string;
  clientName: string;
};

export async function getLawyerEarnings(lawyerSlug: string) {
  const rows = await prisma.consultation.findMany({
    where: { lawyerSlug, status: { in: ["in-progress", "closed"] } },
    select: {
      trackingCode: true,
      subject: true,
      service: true,
      status: true,
      feeToman: true,
      paymentStatus: true,
      createdAt: true,
      user: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const items: EarningRow[] = rows.map((row) => ({
    trackingCode: row.trackingCode,
    subject: row.subject,
    service: serviceTitle(row.service),
    status: row.status,
    feeToman: row.feeToman,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt.toISOString(),
    clientName: row.user.fullName,
  }));

  const monthStart = startOfMonth().toISOString();
  return {
    items,
    total: items.reduce((sum, item) => sum + item.feeToman, 0),
    month: items
      .filter((item) => item.createdAt >= monthStart)
      .reduce((sum, item) => sum + item.feeToman, 0),
    paidCount: items.filter((item) => item.paymentStatus === "stub-paid").length,
  };
}

export type LawyerNoteItem = {
  id: string;
  body: string;
  createdAt: string;
  conversationId?: string;
  caseId?: string;
  clientName?: string;
};

export async function addLawyerNote(input: {
  lawyerSlug: string;
  body: string;
  conversationId?: string;
  caseId?: string;
}) {
  const body = input.body.trim();
  if (body.length < 2) return { error: "متن یادداشت خالی است." as const };

  let userId: string | undefined;
  if (input.conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: input.conversationId, lawyerSlug: input.lawyerSlug },
    });
    if (!conversation) return { error: "گفتگو پیدا نشد." as const };
    userId = conversation.userId;
  }
  if (input.caseId) {
    const row = await prisma.case.findFirst({
      where: { id: input.caseId, lawyerSlug: input.lawyerSlug },
    });
    if (!row) return { error: "پرونده پیدا نشد." as const };
    userId = row.userId;
  }

  await prisma.lawyerNote.create({
    data: {
      lawyerSlug: input.lawyerSlug,
      userId: userId ?? null,
      conversationId: input.conversationId ?? null,
      caseId: input.caseId ?? null,
      body: body.slice(0, 4000),
    },
  });
  return { ok: true as const };
}

export async function listLawyerNotes(
  lawyerSlug: string,
  filter: { conversationId?: string; caseId?: string; take?: number } = {},
): Promise<LawyerNoteItem[]> {
  const rows = await prisma.lawyerNote.findMany({
    where: {
      lawyerSlug,
      ...(filter.conversationId ? { conversationId: filter.conversationId } : {}),
      ...(filter.caseId ? { caseId: filter.caseId } : {}),
    },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: filter.take ?? 50,
  });

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    conversationId: row.conversationId ?? undefined,
    caseId: row.caseId ?? undefined,
    clientName: row.user?.fullName,
  }));
}

export async function deleteLawyerNote(lawyerSlug: string, noteId: string) {
  const result = await prisma.lawyerNote.deleteMany({ where: { id: noteId, lawyerSlug } });
  if (result.count === 0) return { error: "یادداشت پیدا نشد." as const };
  return { ok: true as const };
}
