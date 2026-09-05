import "server-only";

import { prisma } from "@/lib/db";
import { publishUnreadTotal } from "@/lib/chat-events";

export type UnreadSnapshot = {
  total: number;
  byConversation: Record<string, number>;
};

async function countUnreadForUser(userId: string): Promise<UnreadSnapshot> {
  const rows = await prisma.conversation.findMany({
    where: { userId },
    select: {
      id: true,
      userLastReadAt: true,
      createdAt: true,
      messages: {
        where: { authorRole: "lawyer" },
        select: { createdAt: true },
      },
    },
  });

  const byConversation: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    const cursor = row.userLastReadAt ?? row.createdAt;
    const count = row.messages.filter((message) => message.createdAt > cursor).length;
    if (count > 0) {
      byConversation[row.id] = count;
      total += count;
    }
  }
  return { total, byConversation };
}

async function countUnreadForLawyer(lawyerSlug: string): Promise<UnreadSnapshot> {
  const rows = await prisma.conversation.findMany({
    where: { lawyerSlug },
    select: {
      id: true,
      lawyerLastReadAt: true,
      createdAt: true,
      messages: {
        where: { authorRole: "user" },
        select: { createdAt: true },
      },
    },
  });

  const byConversation: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    const cursor = row.lawyerLastReadAt ?? row.createdAt;
    const count = row.messages.filter((message) => message.createdAt > cursor).length;
    if (count > 0) {
      byConversation[row.id] = count;
      total += count;
    }
  }
  return { total, byConversation };
}

export async function getUnreadSnapshot(input: { userId?: string; lawyerSlug?: string; audience: "user" | "lawyer" }) {
  if (input.audience === "lawyer") {
    if (!input.lawyerSlug) return { total: 0, byConversation: {} };
    return countUnreadForLawyer(input.lawyerSlug);
  }
  if (!input.userId) return { total: 0, byConversation: {} };
  return countUnreadForUser(input.userId);
}

export async function markConversationRead(input: {
  conversationId: string;
  audience: "user" | "lawyer";
  userId?: string;
  lawyerSlug?: string;
}) {
  const row = await prisma.conversation.findUnique({
    where: { id: input.conversationId },
    select: { id: true, userId: true, lawyerSlug: true },
  });
  if (!row) return { error: "گفتگو پیدا نشد." as const };

  if (input.audience === "user") {
    if (row.userId !== input.userId) return { error: "اجازه ندارید." as const };
    await prisma.conversation.update({
      where: { id: row.id },
      data: { userLastReadAt: new Date() },
    });
    const snapshot = await countUnreadForUser(row.userId);
    publishUnreadTotal({ audience: "user", userId: row.userId, total: snapshot.total });
    return { ok: true as const, ...snapshot };
  }

  if (row.lawyerSlug !== input.lawyerSlug) return { error: "اجازه ندارید." as const };
  await prisma.conversation.update({
    where: { id: row.id },
    data: { lawyerLastReadAt: new Date() },
  });
  const snapshot = await countUnreadForLawyer(row.lawyerSlug);
  publishUnreadTotal({ audience: "lawyer", lawyerSlug: row.lawyerSlug, total: snapshot.total });
  return { ok: true as const, ...snapshot };
}

export async function refreshAndPublishUnread(input: {
  audience: "user" | "lawyer";
  userId?: string;
  lawyerSlug?: string;
}) {
  const snapshot = await getUnreadSnapshot(input);
  if (input.audience === "user" && input.userId) {
    publishUnreadTotal({ audience: "user", userId: input.userId, total: snapshot.total });
  }
  if (input.audience === "lawyer" && input.lawyerSlug) {
    publishUnreadTotal({ audience: "lawyer", lawyerSlug: input.lawyerSlug, total: snapshot.total });
  }
  return snapshot;
}
