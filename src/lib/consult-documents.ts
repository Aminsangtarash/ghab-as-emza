import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

import { prisma } from "@/lib/db";

export const MAX_CONSULT_FILES = 5;
export const MAX_CONSULT_FILE_BYTES = 8 * 1024 * 1024;

export type DocumentMeta = {
  id: string;
  originalName: string;
  size: number;
};

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

export function toDocumentMeta(row: { id: string; originalName: string; size: number }): DocumentMeta {
  return { id: row.id, originalName: row.originalName, size: row.size };
}

export async function savePendingDocument(userId: string, file: File) {
  const pendingCount = await prisma.consultationDocument.count({
    where: { userId, consultationId: null },
  });
  if (pendingCount >= MAX_CONSULT_FILES) {
    return { error: `حداکثر ${MAX_CONSULT_FILES} فایل می‌توانید پیوست کنید.` as const };
  }
  if (file.size <= 0 || file.size > MAX_CONSULT_FILE_BYTES) {
    return { error: "حجم هر فایل باید حداکثر ۸ مگابایت باشد." as const };
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return { error: "فقط PDF، تصویر یا فایل ورد پذیرفته می‌شود." as const };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = sniffMime(buffer, ext);
  if (!mimeType) {
    return { error: "نوع فایل شناسایی نشد. فایل دیگری انتخاب کنید." as const };
  }

  const storedName = `${randomBytes(16).toString("hex")}.${ext}`;
  await mkdir(storageDir(), { recursive: true });
  await writeFile(filePath(storedName), buffer);

  const row = await prisma.consultationDocument.create({
    data: {
      userId,
      storedName,
      originalName: safeOriginalName(file.name),
      mimeType,
      size: buffer.length,
    },
  });
  return { document: toDocumentMeta(row) };
}

export async function listPendingDocuments(userId: string) {
  const rows = await prisma.consultationDocument.findMany({
    where: { userId, consultationId: null },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toDocumentMeta);
}

export async function listConsultationDocuments(consultationId: string) {
  const rows = await prisma.consultationDocument.findMany({
    where: { consultationId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toDocumentMeta);
}

export async function attachPendingDocuments(userId: string, consultationId: string, documentIds: string[]) {
  const unique = [...new Set(documentIds)].slice(0, MAX_CONSULT_FILES);
  if (unique.length === 0) return { attached: 0 };
  const owned = await prisma.consultationDocument.findMany({
    where: { id: { in: unique }, userId, consultationId: null },
    select: { id: true },
  });
  if (owned.length === 0) return { attached: 0 };
  await prisma.consultationDocument.updateMany({
    where: { id: { in: owned.map((item) => item.id) }, userId, consultationId: null },
    data: { consultationId },
  });
  return { attached: owned.length };
}

export async function deletePendingDocument(userId: string, documentId: string) {
  const row = await prisma.consultationDocument.findFirst({
    where: { id: documentId, userId, consultationId: null },
  });
  if (!row) return { error: "فایل پیدا نشد." as const };
  await prisma.consultationDocument.delete({ where: { id: row.id } });
  await unlink(filePath(row.storedName)).catch(() => undefined);
  return { ok: true as const };
}

export async function getReadableDocument(input: {
  documentId: string;
  trackingCode: string;
  userId: string;
  role: string;
  lawyerSlug?: string;
}) {
  const row = await prisma.consultationDocument.findFirst({
    where: { id: input.documentId },
    include: { consultation: true },
  });
  if (!row?.consultation || row.consultation.trackingCode !== input.trackingCode) {
    return null;
  }

  const owner = row.userId === input.userId;
  const assignedLawyer =
    input.role === "lawyer" &&
    Boolean(input.lawyerSlug) &&
    row.consultation.lawyerSlug === input.lawyerSlug;
  if (!owner && !assignedLawyer) return null;

  return {
    path: filePath(row.storedName),
    mimeType: row.mimeType,
    originalName: row.originalName,
    size: row.size,
  };
}

export async function removeStoredFiles(storedNames: string[]) {
  await Promise.all(storedNames.map((name) => unlink(filePath(name)).catch(() => undefined)));
}
