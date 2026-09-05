import "server-only";

import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

import { publishChatMessage } from "@/lib/chat-events";
import { refreshAndPublishUnread } from "@/lib/chat-unread";
import { prisma } from "@/lib/db";
import {
  MAX_CONSULT_FILE_BYTES,
  toDocumentMeta,
} from "@/lib/consult-documents";
import type {
  ClientDocumentRequest,
  ClientDocumentRequestItem,
  DocumentRequestItemStatus,
} from "@/lib/document-request-types";

export type {
  ClientDocumentRequest,
  ClientDocumentRequestItem,
  DocumentRequestItemStatus,
} from "@/lib/document-request-types";
export {
  DEFAULT_DOCUMENT_REQUEST_TITLES,
  documentRequestItemStatuses,
} from "@/lib/document-request-types";

const ALLOWED_EXT = new Set(["pdf", "png", "jpg", "jpeg", "webp", "docx"]);

function storageDir() {
  return path.join(process.cwd(), "storage", "consult-docs");
}

function filePath(storedName: string) {
  return path.join(storageDir(), storedName);
}

function sniffMime(buffer: Buffer, ext: string) {
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    ext === "docx" &&
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05)
  ) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return null;
}

function safeOriginalName(name: string) {
  const cleaned = name.replace(/[^\u0600-\u06FFa-zA-Z0-9._\s-]/g, "").trim().slice(0, 120);
  return cleaned || "document";
}

function toClientItem(row: {
  id: string;
  title: string;
  sortOrder: number;
  status: string;
  documentId: string | null;
  reviewedAt: Date | null;
  rejectReason: string | null;
  document?: { id: string; originalName: string; mimeType: string; size: number } | null;
}): ClientDocumentRequestItem {
  return {
    id: row.id,
    title: row.title,
    sortOrder: row.sortOrder,
    status: row.status as DocumentRequestItemStatus,
    documentId: row.documentId ?? undefined,
    documentName: row.document?.originalName,
    documentMimeType: row.document?.mimeType,
    documentSize: row.document?.size,
    reviewedAt: row.reviewedAt?.toISOString(),
    rejectReason: row.rejectReason ?? undefined,
  };
}

function toClientRequest(row: {
  id: string;
  conversationId: string;
  consultationId: string;
  messageId: string | null;
  note: string | null;
  createdAt: Date;
  consultation: { trackingCode: string };
  items: Array<{
    id: string;
    title: string;
    sortOrder: number;
    status: string;
    documentId: string | null;
    reviewedAt: Date | null;
    rejectReason: string | null;
    document?: { id: string; originalName: string; mimeType: string; size: number } | null;
  }>;
}): ClientDocumentRequest {
  const items = row.items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toClientItem);
  return {
    id: row.id,
    conversationId: row.conversationId,
    consultationId: row.consultationId,
    messageId: row.messageId ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.createdAt.toISOString(),
    trackingCode: row.consultation.trackingCode,
    items,
    pendingCount: items.filter((item) => item.status === "pending" || item.status === "rejected").length,
    uploadedCount: items.filter((item) => item.status === "uploaded").length,
    approvedCount: items.filter((item) => item.status === "approved").length,
  };
}

const requestInclude = {
  consultation: { select: { trackingCode: true } },
  items: {
    include: {
      document: { select: { id: true, originalName: true, mimeType: true, size: true } },
    },
    orderBy: { sortOrder: "asc" as const },
  },
} as const;

export async function listConversationDocumentRequests(conversationId: string) {
  const rows = await prisma.documentRequest.findMany({
    where: { conversationId },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toClientRequest);
}

export async function getLatestDocumentRequest(conversationId: string) {
  const row = await prisma.documentRequest.findFirst({
    where: { conversationId },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
  });
  return row ? toClientRequest(row) : null;
}

export async function createDocumentRequest(input: {
  conversationId: string;
  lawyerSlug: string;
  titles: string[];
  note?: string;
}) {
  const titles = [...new Set(input.titles.map((title) => title.trim()).filter(Boolean))].slice(0, 20);
  if (titles.length === 0) {
    return { error: "حداقل یک مدرک برای درخواست لازم است." as const };
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: input.conversationId, lawyerSlug: input.lawyerSlug },
    include: { consultation: { select: { id: true, trackingCode: true, subject: true } } },
  });
  if (!conversation) return { error: "گفتگو پیدا نشد." as const };
  if (conversation.closedAt) return { error: "گفتگوی بسته‌شده قابل درخواست مدرک نیست." as const };

  const bodyLines = [
    "وکیل مدارک زیر را از شما درخواست کرده است. لطفاً برای هر مورد فایل مربوط را بارگذاری کنید:",
    ...titles.map((title, index) => `${index + 1}. ${title}`),
  ];
  if (input.note?.trim()) {
    bodyLines.push("", `توضیح وکیل: ${input.note.trim()}`);
  }

  const created = await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        conversationId: conversation.id,
        authorRole: "system",
        body: bodyLines.join("\n"),
      },
    });

    const request = await tx.documentRequest.create({
      data: {
        conversationId: conversation.id,
        consultationId: conversation.consultationId,
        messageId: message.id,
        note: input.note?.trim()?.slice(0, 500) || null,
        createdByLawyerSlug: input.lawyerSlug,
        items: {
          create: titles.map((title, index) => ({
            title: title.slice(0, 160),
            sortOrder: index,
            status: "pending",
          })),
        },
      },
      include: requestInclude,
    });

    return { message, request };
  });

  publishChatMessage({
    conversationId: conversation.id,
    subject: conversation.consultation.subject,
    message: {
      id: created.message.id,
      authorRole: "system",
      body: created.message.body,
      createdAt: created.message.createdAt.toISOString(),
    },
    userId: conversation.userId,
    lawyerSlug: conversation.lawyerSlug,
  });
  void refreshAndPublishUnread({ audience: "user", userId: conversation.userId });

  return { ok: true as const, request: toClientRequest(created.request) };
}

export async function uploadDocumentRequestItem(input: {
  conversationId: string;
  itemId: string;
  userId: string;
  file: File;
}) {
  const item = await prisma.documentRequestItem.findFirst({
    where: { id: input.itemId, request: { conversationId: input.conversationId } },
    include: {
      request: {
        include: {
          conversation: true,
          consultation: { select: { id: true, trackingCode: true } },
        },
      },
      document: true,
    },
  });
  if (!item) return { error: "مورد درخواستی پیدا نشد." as const };
  if (item.request.conversation.userId !== input.userId) {
    return { error: "اجازه بارگذاری این مدرک را ندارید." as const };
  }
  if (item.request.conversation.closedAt) {
    return { error: "گفتگو بسته شده است." as const };
  }
  if (item.status === "approved") {
    return { error: "این مدرک قبلاً تأیید شده و قابل جایگزینی نیست." as const };
  }
  if (input.file.size <= 0 || input.file.size > MAX_CONSULT_FILE_BYTES) {
    return { error: "حجم هر فایل باید حداکثر ۸ مگابایت باشد." as const };
  }

  const ext = (input.file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return { error: "فقط PDF، تصویر یا فایل ورد پذیرفته می‌شود." as const };
  }

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const mimeType = sniffMime(buffer, ext);
  if (!mimeType) {
    return { error: "نوع فایل شناسایی نشد. فایل دیگری انتخاب کنید." as const };
  }

  const storedName = `${randomBytes(16).toString("hex")}.${ext}`;
  await mkdir(storageDir(), { recursive: true });
  await writeFile(filePath(storedName), buffer);

  const previousStoredName = item.document?.storedName;

  const updated = await prisma.$transaction(async (tx) => {
    const document = await tx.consultationDocument.create({
      data: {
        userId: input.userId,
        consultationId: item.request.consultationId,
        storedName,
        originalName: safeOriginalName(input.file.name),
        mimeType,
        size: buffer.length,
      },
    });

    if (item.documentId) {
      await tx.documentRequestItem.update({
        where: { id: item.id },
        data: { documentId: null },
      });
      await tx.consultationDocument.delete({ where: { id: item.documentId } }).catch(() => undefined);
    }

    return tx.documentRequestItem.update({
      where: { id: item.id },
      data: {
        documentId: document.id,
        status: "uploaded",
        reviewedAt: null,
        rejectReason: null,
      },
      include: {
        document: { select: { id: true, originalName: true, mimeType: true, size: true } },
        request: { include: requestInclude },
      },
    });
  });

  if (previousStoredName) {
    await unlink(filePath(previousStoredName)).catch(() => undefined);
  }

  return {
    ok: true as const,
    item: toClientItem(updated),
    request: toClientRequest(updated.request),
    document: updated.document ? toDocumentMeta(updated.document) : undefined,
  };
}

export async function reviewDocumentRequestItem(input: {
  itemId: string;
  lawyerSlug: string;
  action: "approve" | "reject";
  reason?: string;
}) {
  const item = await prisma.documentRequestItem.findFirst({
    where: { id: input.itemId },
    include: {
      request: true,
      document: { select: { id: true, originalName: true, mimeType: true, size: true } },
    },
  });
  if (!item) return { error: "مورد درخواستی پیدا نشد." as const };
  if (item.request.createdByLawyerSlug !== input.lawyerSlug) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: item.request.conversationId, lawyerSlug: input.lawyerSlug },
      select: { id: true },
    });
    if (!conversation) return { error: "اجازه بررسی این مدرک را ندارید." as const };
  }
  if (!item.documentId || item.status === "pending") {
    return { error: "ابتدا باید فایل توسط موکل بارگذاری شود." as const };
  }
  if (input.action === "approve" && !item.documentId) {
    return { error: "فایلی برای تأیید وجود ندارد." as const };
  }

  const updated = await prisma.documentRequestItem.update({
    where: { id: item.id },
    data:
      input.action === "approve"
        ? {
            status: "approved",
            reviewedAt: new Date(),
            rejectReason: null,
          }
        : {
            status: "rejected",
            reviewedAt: new Date(),
            rejectReason: input.reason?.trim()?.slice(0, 300) || "لطفاً فایل صحیح‌تری بارگذاری کنید.",
          },
    include: {
      document: { select: { id: true, originalName: true, mimeType: true, size: true } },
      request: { include: requestInclude },
    },
  });

  return { ok: true as const, item: toClientItem(updated), request: toClientRequest(updated.request) };
}
