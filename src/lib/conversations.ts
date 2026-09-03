import type { Conversation, Message, Rating } from "@/generated/prisma";

import { lawyerLabel, serviceTitle, type ConsultChannel, type ConsultationStatus } from "@/lib/consult";
import { prisma } from "@/lib/db";

export type MessageAuthor = "user" | "lawyer" | "system";

export type ClientMessage = {
  id: string;
  authorRole: MessageAuthor;
  body: string;
  createdAt: string;
};

export type ClientConversation = {
  id: string;
  trackingCode: string;
  subject: string;
  channel: ConsultChannel;
  lawyerName: string;
  lawyerSlug: string;
  status: ConsultationStatus;
  createdAt: string;
  closedAt?: string;
  closeSummary?: string;
  phoneCallDone: boolean;
  videoLive: boolean;
  videoEnded: boolean;
  hasRated: boolean;
  ratingScore?: number;
  lastMessage?: string;
  lastMessageRole?: MessageAuthor;
  needsReply: boolean;
  clientName?: string;
  clientPhone?: string;
  caseId?: string;
  documents: { id: string; originalName: string; size: number }[];
};

async function creditWallet(userId: string, amount: number, reason: string, consultationId?: string, note?: string) {
  if (amount <= 0) return 0;
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amount } },
    }),
    prisma.walletEntry.create({
      data: { userId, amount, reason, consultationId, note },
    }),
  ]);
  return amount;
}

async function refundConsultation(consultationId: string, userId: string, feeToman: number, paymentStatus: string) {
  if (feeToman <= 0 || paymentStatus !== "stub-paid") return 0;
  const refunded = await creditWallet(
    userId,
    feeToman,
    "refund",
    consultationId,
    "برگشت مبلغ به‌خاطر لغو یا عدم تأیید وکیل",
  );
  await prisma.consultation.update({
    where: { id: consultationId },
    data: { paymentStatus: "refunded-wallet", refundedToman: refunded },
  });
  return refunded;
}

async function addSystemMessage(conversationId: string, body: string) {
  await prisma.message.create({
    data: { conversationId, authorRole: "system", body },
  });
}

export async function acceptConsultation(
  lawyerSlug: string,
  trackingCode: string,
  firstMessage?: string,
) {
  const row = await prisma.consultation.findUnique({
    where: { trackingCode },
    include: { conversation: true },
  });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status === "cancelled" || row.status === "closed") {
    return { error: "این درخواست دیگر قابل پذیرش نیست." as const };
  }
  if (row.conversation) return { error: "گفتگوی این درخواست قبلاً باز شده است." as const };
  if (row.status === "awaiting-lawyer" && row.lawyerSlug && row.lawyerSlug !== lawyerSlug) {
    return { error: "این درخواست برای وکیل دیگری ثبت شده است." as const };
  }

  const updated = await prisma.consultation.update({
    where: { id: row.id },
    data: {
      status: "in-progress",
      lawyerSlug,
      lawyerVisible: true,
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      consultationId: updated.id,
      userId: updated.userId,
      lawyerSlug,
    },
  });

  const channelNote =
    updated.channel === "phone"
      ? "تماس تلفنی خارج از برنامه، در ساعات کاری دفتر انجام می‌شود. پس از انجام تماس، وکیل آن را ثبت می‌کند و می‌توانید ابهام‌ها را همین‌جا بپرسید."
      : updated.channel === "video"
        ? "تماس تصویری داخل برنامه برگزار می‌شود. پس از جلسه، گفتگوی متنی برای رفع ابهام باز می‌ماند."
        : "گفتگوی متنی با وکیل از همین‌جا انجام می‌شود.";

  await addSystemMessage(
    conversation.id,
    `وکیل ${lawyerLabel(lawyerSlug) ?? ""} درخواست را پذیرفت. ${channelNote}`,
  );

  const intro = firstMessage?.trim();
  if (intro) {
    const lawyerAccount = await prisma.user.findFirst({ where: { lawyerSlug } });
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        authorRole: "lawyer",
        body: intro.slice(0, 4000),
        userId: lawyerAccount?.id,
      },
    });
  }

  return { conversationId: conversation.id };
}

export async function rejectOrCancelConsultation(input: {
  trackingCode: string;
  actor: "lawyer" | "user";
  lawyerSlug?: string;
  userId?: string;
  reason?: string;
}) {
  const row = await prisma.consultation.findUnique({ where: { trackingCode: input.trackingCode } });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status === "cancelled" || row.status === "closed") {
    return { error: "این درخواست قبلاً بسته یا لغو شده است." as const };
  }
  if (row.status === "in-progress") {
    return { error: "گفتگوی فعال را فقط وکیل می‌تواند ببندد؛ لغو از این مرحله ممکن نیست." as const };
  }
  if (input.actor === "user" && row.userId !== input.userId) {
    return { error: "اجازه لغو این درخواست را ندارید." as const };
  }
  if (
    input.actor === "lawyer" &&
    row.status === "awaiting-lawyer" &&
    row.lawyerSlug &&
    row.lawyerSlug !== input.lawyerSlug
  ) {
    return { error: "این درخواست برای وکیل دیگری است." as const };
  }

  const reason =
    input.reason?.trim() ||
    (input.actor === "lawyer" ? "عدم پذیرش توسط وکیل" : "لغو توسط کاربر");

  await prisma.consultation.update({
    where: { id: row.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason,
    },
  });

  const refunded = await refundConsultation(row.id, row.userId, row.feeToman, row.paymentStatus);
  return { ok: true as const, refunded };
}

const conversationInclude = {
  consultation: {
    include: {
      case: { select: { id: true } },
      documents: { select: { id: true, originalName: true, size: true } },
    },
  },
  user: { select: { fullName: true, phone: true } },
  rating: true,
  messages: { orderBy: { createdAt: "desc" }, take: 1 },
} as const;

export async function listUserConversations(userId: string): Promise<ClientConversation[]> {
  const rows = await prisma.conversation.findMany({
    where: { userId },
    include: conversationInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toClientConversation);
}

export async function listLawyerConversations(
  lawyerSlug: string,
  filter: "all" | "open" | "closed" | "needs-reply" = "all",
): Promise<ClientConversation[]> {
  const rows = await prisma.conversation.findMany({
    where: {
      lawyerSlug,
      ...(filter === "open" || filter === "needs-reply" ? { closedAt: null } : {}),
      ...(filter === "closed" ? { closedAt: { not: null } } : {}),
    },
    include: conversationInclude,
    orderBy: { createdAt: "desc" },
  });
  const items = rows.map(toClientConversation);
  return filter === "needs-reply" ? items.filter((item) => item.needsReply) : items;
}

export async function listLawyerQueue(lawyerSlug: string) {
  return prisma.consultation.findMany({
    where: {
      status: { in: ["awaiting-lawyer", "awaiting-operator"] },
      OR: [{ lawyerSlug }, { lawyerSlug: null, lawyerMode: "assign" }],
    },
    include: {
      user: { select: { fullName: true, phone: true } },
      documents: { select: { id: true, originalName: true, size: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type LawyerQueueItem = {
  trackingCode: string;
  subject: string;
  message: string;
  channel: ConsultChannel;
  status: ConsultationStatus;
  serviceTitle: string;
  urgency: string;
  caseStage: string;
  city?: string;
  preferredSlot?: string;
  feeToman: number;
  paymentStatus: string;
  assignedToMe: boolean;
  clientName: string;
  clientPhone: string;
  createdAt: string;
  documents: { id: string; originalName: string; size: number }[];
};

export async function listLawyerQueueItems(lawyerSlug: string): Promise<LawyerQueueItem[]> {
  const rows = await listLawyerQueue(lawyerSlug);
  return rows.map((row) => ({
    trackingCode: row.trackingCode,
    subject: row.subject,
    message: row.message,
    channel: row.channel as ConsultChannel,
    status: row.status as ConsultationStatus,
    serviceTitle: serviceTitle(row.service),
    urgency: row.urgency,
    caseStage: row.caseStage,
    city: row.city ?? undefined,
    preferredSlot: row.preferredSlot ?? undefined,
    feeToman: row.feeToman,
    paymentStatus: row.paymentStatus,
    assignedToMe: row.lawyerSlug === lawyerSlug,
    clientName: row.user.fullName,
    clientPhone: row.user.phone,
    createdAt: row.createdAt.toISOString(),
    documents: row.documents,
  }));
}

export async function getConversationForUser(userId: string, conversationId: string) {
  const row = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { ...conversationInclude, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!row) return null;
  return { summary: toClientConversation(row), messages: row.messages.map(toClientMessage), rating: row.rating };
}

export async function getConversationForLawyer(lawyerSlug: string, conversationId: string) {
  const row = await prisma.conversation.findFirst({
    where: { id: conversationId, lawyerSlug },
    include: {
      ...conversationInclude,
      consultation: {
        include: {
          case: { select: { id: true } },
          documents: { select: { id: true, originalName: true, size: true } },
        },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!row) return null;
  return {
    summary: toClientConversation(row),
    messages: row.messages.map(toClientMessage),
    rating: row.rating,
    detail: {
      requestMessage: row.consultation.message,
      urgency: row.consultation.urgency,
      caseStage: row.consultation.caseStage,
      service: serviceTitle(row.consultation.service),
      city: row.consultation.city ?? undefined,
      preferredSlot: row.consultation.preferredSlot ?? undefined,
      feeToman: row.consultation.feeToman,
      paymentStatus: row.consultation.paymentStatus,
      clientEmail: row.consultation.email ?? undefined,
    },
  };
}

export async function postConversationMessage(input: {
  conversationId: string;
  authorRole: "user" | "lawyer";
  userId: string;
  body: string;
  lawyerSlug?: string;
}) {
  const body = input.body.trim();
  if (body.length < 1) return { error: "متن پیام خالی است." as const };
  if (body.length > 4000) return { error: "پیام بیش از حد طولانی است." as const };

  const row = await prisma.conversation.findUnique({ where: { id: input.conversationId } });
  if (!row || row.closedAt) return { error: "گفتگو بسته شده یا پیدا نشد." as const };
  if (input.authorRole === "user" && row.userId !== input.userId) {
    return { error: "اجازه ارسال پیام ندارید." as const };
  }
  if (input.authorRole === "lawyer" && row.lawyerSlug !== input.lawyerSlug) {
    return { error: "اجازه ارسال پیام ندارید." as const };
  }

  const message = await prisma.message.create({
    data: {
      conversationId: row.id,
      authorRole: input.authorRole,
      body,
      userId: input.userId,
    },
  });
  return { message: toClientMessage(message) };
}

export async function markPhoneCallDone(lawyerSlug: string, conversationId: string) {
  const row = await prisma.conversation.findFirst({
    where: { id: conversationId, lawyerSlug },
    include: { consultation: true },
  });
  if (!row) return { error: "گفتگو پیدا نشد." as const };
  if (row.consultation.channel !== "phone") return { error: "این مورد تماس تلفنی نیست." as const };
  if (row.closedAt) return { error: "گفتگو بسته شده است." as const };
  if (row.phoneCallDoneAt) return { ok: true as const };

  await prisma.conversation.update({
    where: { id: row.id },
    data: { phoneCallDoneAt: new Date() },
  });
  await addSystemMessage(
    row.id,
    "وکیل انجام تماس تلفنی را ثبت کرد. اگر ابهامی مانده، همین‌جا به‌صورت متنی بپرسید.",
  );
  return { ok: true as const };
}

export async function setVideoSession(
  conversationId: string,
  action: "start" | "end",
  access: { userId?: string; lawyerSlug?: string },
) {
  const row = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { consultation: true },
  });
  if (!row) return { error: "گفتگو پیدا نشد." as const };
  if (row.consultation.channel !== "video") return { error: "این مورد تماس تصویری نیست." as const };
  if (row.closedAt) return { error: "گفتگو بسته شده است." as const };
  const allowed = row.userId === access.userId || row.lawyerSlug === access.lawyerSlug;
  if (!allowed) return { error: "اجازه ورود به جلسه را ندارید." as const };

  if (action === "start") {
    await prisma.conversation.update({
      where: { id: row.id },
      data: { videoStartedAt: row.videoStartedAt ?? new Date(), videoEndedAt: null },
    });
    if (!row.videoStartedAt) {
      await addSystemMessage(row.id, "جلسه تماس تصویری داخل برنامه شروع شد.");
    }
    return { ok: true as const, live: true };
  }

  await prisma.conversation.update({
    where: { id: row.id },
    data: { videoEndedAt: new Date() },
  });
  await addSystemMessage(row.id, "جلسه تصویری پایان یافت. رفع ابهام را می‌توانید با گفتگوی متنی ادامه دهید.");
  return { ok: true as const, live: false };
}

export async function closeConversation(
  lawyerSlug: string,
  conversationId: string,
  summary?: string,
) {
  const row = await prisma.conversation.findFirst({
    where: { id: conversationId, lawyerSlug },
    include: { consultation: true },
  });
  if (!row) return { error: "گفتگو پیدا نشد." as const };
  if (row.closedAt) return { ok: true as const };

  const closeSummary = summary?.trim()?.slice(0, 4000) || null;
  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: row.id },
      data: {
        closedAt: new Date(),
        videoEndedAt: row.videoEndedAt ?? new Date(),
        closeSummary,
      },
    }),
    prisma.consultation.update({
      where: { id: row.consultationId },
      data: { status: "closed" },
    }),
    prisma.appointment.updateMany({
      where: { conversationId: row.id, status: "scheduled" },
      data: { status: "done" },
    }),
  ]);
  await addSystemMessage(
    row.id,
    closeSummary
      ? `وکیل گفتگو را بست. جمع‌بندی نهایی: ${closeSummary}`
      : "وکیل گفتگو را بست. اکنون می‌توانید به این مشاوره امتیاز بدهید.",
  );
  return { ok: true as const };
}

export async function reopenConversation(lawyerSlug: string, conversationId: string) {
  const row = await prisma.conversation.findFirst({
    where: { id: conversationId, lawyerSlug },
    include: { rating: true },
  });
  if (!row) return { error: "گفتگو پیدا نشد." as const };
  if (!row.closedAt) return { ok: true as const };
  if (row.rating) return { error: "پس از ثبت امتیاز موکل، بازکردن گفتگو ممکن نیست." as const };

  await prisma.$transaction([
    prisma.conversation.update({ where: { id: row.id }, data: { closedAt: null } }),
    prisma.consultation.update({
      where: { id: row.consultationId },
      data: { status: "in-progress" },
    }),
  ]);
  await addSystemMessage(row.id, "وکیل گفتگو را برای پیگیری بیشتر باز کرد.");
  return { ok: true as const };
}

export async function rateConversation(userId: string, conversationId: string, score: number, comment?: string) {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { error: "امتیاز باید بین ۱ تا ۵ باشد." as const };
  }
  const row = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { rating: true },
  });
  if (!row) return { error: "گفتگو پیدا نشد." as const };
  if (!row.closedAt) return { error: "تا وقتی وکیل گفتگو را نبندد، امتیاز ثبت نمی‌شود." as const };
  if (row.rating) return { error: "قبلاً امتیاز داده‌اید." as const };

  await prisma.rating.create({
    data: {
      conversationId: row.id,
      userId,
      score,
      comment: comment?.trim() ? comment.trim().slice(0, 500) : null,
    },
  });
  return { ok: true as const };
}

export async function listWalletEntries(userId: string, take = 20) {
  return prisma.walletEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getWalletOverview(userId: string, take = 30) {
  const [count, sum, entries] = await Promise.all([
    prisma.walletEntry.count({ where: { userId } }),
    prisma.walletEntry.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
    listWalletEntries(userId, take),
  ]);
  return {
    count,
    credited: sum._sum.amount ?? 0,
    entries,
  };
}

function toClientMessage(row: Message): ClientMessage {
  return {
    id: row.id,
    authorRole: row.authorRole as MessageAuthor,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

function toClientConversation(
  row: Conversation & {
    consultation: {
      trackingCode: string;
      subject: string;
      channel: string;
      status: string;
      case?: { id: string } | null;
      documents?: { id: string; originalName: string; size: number }[];
    };
    user?: { fullName: string; phone: string } | null;
    rating?: Rating | null;
    messages?: Message[];
  },
): ClientConversation {
  const sorted = row.messages ? [...row.messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) : [];
  const last = sorted[0];
  const lastRole = last?.authorRole as MessageAuthor | undefined;
  return {
    id: row.id,
    trackingCode: row.consultation.trackingCode,
    subject: row.consultation.subject,
    channel: row.consultation.channel as ConsultChannel,
    lawyerName: lawyerLabel(row.lawyerSlug) ?? "وکیل",
    lawyerSlug: row.lawyerSlug,
    status: row.consultation.status as ConsultationStatus,
    createdAt: row.createdAt.toISOString(),
    closedAt: row.closedAt?.toISOString(),
    closeSummary: row.closeSummary ?? undefined,
    phoneCallDone: Boolean(row.phoneCallDoneAt),
    videoLive: Boolean(row.videoStartedAt && !row.videoEndedAt),
    videoEnded: Boolean(row.videoEndedAt),
    hasRated: Boolean(row.rating),
    ratingScore: row.rating?.score,
    lastMessage: last?.body,
    lastMessageRole: lastRole,
    needsReply: !row.closedAt && lastRole === "user",
    clientName: row.user?.fullName,
    clientPhone: row.user?.phone,
    caseId: row.consultation.case?.id,
    documents: row.consultation.documents ?? [],
  };
}
