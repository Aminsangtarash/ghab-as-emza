import "server-only";

import { randomUUID } from "crypto";

import { createLawyerAccount } from "@/lib/admin-ops";
import { prisma } from "@/lib/db";

export type CooperationStatus = "pending" | "approved" | "rejected";

export type CooperationItem = {
  id: string;
  status: CooperationStatus;
  fullName: string;
  phone: string;
  email: string | null;
  city: string;
  specialty: string;
  licenseNumber: string | null;
  experienceYears: number;
  bio: string | null;
  message: string;
  staffNote: string | null;
  lawyerSlug: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type Row = {
  id: string;
  status: string;
  fullName: string;
  phone: string;
  email: string | null;
  city: string;
  specialty: string;
  licenseNumber: string | null;
  experienceYears: number;
  bio: string | null;
  message: string;
  staffNote: string | null;
  lawyerSlug: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

function mapRow(row: Row): CooperationItem {
  return {
    id: row.id,
    status: row.status as CooperationStatus,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email,
    city: row.city,
    specialty: row.specialty,
    licenseNumber: row.licenseNumber,
    experienceYears: Number(row.experienceYears ?? 0),
    bio: row.bio,
    message: row.message,
    staffNote: row.staffNote,
    lawyerSlug: row.lawyerSlug,
    createdAt: new Date(row.createdAt).toISOString(),
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null,
  };
}

export async function createCooperationApplication(input: {
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  specialty: string;
  licenseNumber?: string;
  experienceYears: number;
  bio?: string;
  message: string;
}) {
  const existingUser = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (existingUser) {
    return { error: "این شماره قبلاً در سامانه ثبت شده است." as const };
  }

  const pending = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM CooperationApplication WHERE phone = ? AND status = 'pending' LIMIT 1`,
    input.phone,
  );
  if (pending[0]) {
    return { error: "درخواست همکاری باز با این شماره از قبل ثبت شده است." as const };
  }

  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO CooperationApplication
      (id, status, fullName, phone, email, city, specialty, licenseNumber, experienceYears, bio, message, createdAt, updatedAt)
     VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    id,
    input.fullName.slice(0, 120),
    input.phone,
    input.email?.slice(0, 120) || null,
    input.city.slice(0, 60),
    input.specialty.slice(0, 120),
    input.licenseNumber?.slice(0, 80) || null,
    Math.max(0, Math.min(60, Math.round(input.experienceYears))),
    input.bio?.slice(0, 2000) || null,
    input.message.slice(0, 3000),
  );

  return { ok: true as const, id };
}

export async function listCooperationApplications(status?: CooperationStatus) {
  const rows = status
    ? await prisma.$queryRawUnsafe<Row[]>(
        `SELECT * FROM CooperationApplication WHERE status = ? ORDER BY createdAt DESC LIMIT 100`,
        status,
      )
    : await prisma.$queryRawUnsafe<Row[]>(
        `SELECT * FROM CooperationApplication
         ORDER BY FIELD(status,'pending','approved','rejected'), createdAt DESC LIMIT 100`,
      );
  return rows.map(mapRow);
}

export async function countPendingCooperations() {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ c: bigint | number }>>(
      `SELECT COUNT(*) AS c FROM CooperationApplication WHERE status = 'pending'`,
    );
    return Number(rows[0]?.c ?? 0);
  } catch {
    return 0;
  }
}

export async function rejectCooperationApplication(id: string, staffNote?: string) {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT * FROM CooperationApplication WHERE id = ? LIMIT 1`,
    id,
  );
  const row = rows[0];
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status !== "pending") return { error: "این درخواست قبلاً رسیدگی شده است." as const };

  await prisma.$executeRawUnsafe(
    `UPDATE CooperationApplication
     SET status = 'rejected', staffNote = ?, reviewedAt = NOW(3), updatedAt = NOW(3)
     WHERE id = ?`,
    staffNote?.trim().slice(0, 1000) || "رد شده توسط مدیریت",
    id,
  );
  return { ok: true as const };
}

export async function approveCooperationApplication(id: string, staffNote?: string) {
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT * FROM CooperationApplication WHERE id = ? LIMIT 1`,
    id,
  );
  const row = rows[0];
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status !== "pending") return { error: "این درخواست قبلاً رسیدگی شده است." as const };

  const password = row.phone;
  const created = await createLawyerAccount({
    fullName: row.fullName,
    phone: row.phone,
    password,
    city: row.city,
    specialty: row.specialty,
    title: "وکیل پایه یک دادگستری",
    bio: row.bio ?? undefined,
  });
  if ("error" in created) return created;

  await prisma.$executeRawUnsafe(
    `UPDATE CooperationApplication
     SET status = 'approved', lawyerSlug = ?, staffNote = ?, reviewedAt = NOW(3), updatedAt = NOW(3)
     WHERE id = ?`,
    created.slug,
    staffNote?.trim().slice(0, 1000) || "تأیید و ساخت حساب وکیل",
    id,
  );

  // همگام‌سازی سال تجربه در پروفایل در صورت وجود
  if (row.experienceYears > 0) {
    await prisma.lawyerProfile
      .update({
        where: { slug: created.slug },
        data: {
          years: row.experienceYears,
          experience: `${row.experienceYears} سال`,
          officePhone: row.phone,
        },
      })
      .catch(() => undefined);
  }

  return {
    ok: true as const,
    slug: created.slug,
    phone: row.phone,
    password,
    fullName: row.fullName,
  };
}
