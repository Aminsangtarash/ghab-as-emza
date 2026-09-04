import "server-only";

import { randomUUID } from "crypto";

import { prisma } from "@/lib/db";

export type SupportTicketStatus = "new" | "in-progress" | "resolved";

export type SupportTicketItem = {
  id: string;
  source: string;
  status: SupportTicketStatus;
  fullName: string;
  phone: string | null;
  email: string | null;
  subject: string;
  body: string;
  staffNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

type TicketRow = {
  id: string;
  source: string;
  status: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  subject: string;
  body: string;
  staffNote: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
};

function mapRow(row: TicketRow): SupportTicketItem {
  return {
    id: row.id,
    source: row.source,
    status: row.status as SupportTicketStatus,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email,
    subject: row.subject,
    body: row.body,
    staffNote: row.staffNote,
    createdAt: new Date(row.createdAt).toISOString(),
    resolvedAt: row.resolvedAt ? new Date(row.resolvedAt).toISOString() : null,
  };
}

export async function createSupportTicket(input: {
  fullName: string;
  phone?: string;
  email?: string;
  subject: string;
  body: string;
  source?: "contact" | "user" | "staff";
  userId?: string;
}) {
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO SupportTicket (id, source, status, fullName, phone, email, subject, body, userId, createdAt, updatedAt)
     VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    id,
    input.source ?? "contact",
    input.fullName.trim().slice(0, 120),
    input.phone?.trim().slice(0, 20) || null,
    input.email?.trim().slice(0, 120) || null,
    input.subject.trim().slice(0, 160),
    input.body.trim().slice(0, 4000),
    input.userId ?? null,
  );
  return { id };
}

export async function listSupportTickets(status?: SupportTicketStatus) {
  const rows = status
    ? await prisma.$queryRawUnsafe<TicketRow[]>(
        `SELECT id, source, status, fullName, phone, email, subject, body, staffNote, createdAt, resolvedAt
         FROM SupportTicket WHERE status = ? ORDER BY createdAt DESC LIMIT 100`,
        status,
      )
    : await prisma.$queryRawUnsafe<TicketRow[]>(
        `SELECT id, source, status, fullName, phone, email, subject, body, staffNote, createdAt, resolvedAt
         FROM SupportTicket ORDER BY FIELD(status,'new','in-progress','resolved'), createdAt DESC LIMIT 100`,
      );
  return rows.map(mapRow);
}

export async function updateSupportTicket(
  id: string,
  input: { status?: SupportTicketStatus; staffNote?: string },
) {
  const existing = await prisma.$queryRawUnsafe<TicketRow[]>(
    `SELECT id, source, status, fullName, phone, email, subject, body, staffNote, createdAt, resolvedAt
     FROM SupportTicket WHERE id = ? LIMIT 1`,
    id,
  );
  if (!existing[0]) return { error: "تیکت پیدا نشد." as const };

  const status = input.status ?? (existing[0].status as SupportTicketStatus);
  const note =
    input.staffNote !== undefined ? input.staffNote.trim().slice(0, 2000) : existing[0].staffNote;
  const resolvedAt = status === "resolved" ? new Date() : status === "new" ? null : existing[0].resolvedAt;

  await prisma.$executeRawUnsafe(
    `UPDATE SupportTicket SET status = ?, staffNote = ?, resolvedAt = ?, updatedAt = NOW(3) WHERE id = ?`,
    status,
    note,
    resolvedAt,
    id,
  );

  return {
    ok: true as const,
    item: {
      id,
      status,
      staffNote: note,
      resolvedAt: resolvedAt ? new Date(resolvedAt).toISOString() : null,
    },
  };
}

export async function countOpenSupportTickets() {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ c: bigint | number }>>(
      `SELECT COUNT(*) AS c FROM SupportTicket WHERE status IN ('new','in-progress')`,
    );
    return Number(rows[0]?.c ?? 0);
  } catch {
    return 0;
  }
}
