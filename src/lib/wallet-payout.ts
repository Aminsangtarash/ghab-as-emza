import "server-only";

import { randomUUID } from "crypto";

import { prisma } from "@/lib/db";

export type PayoutStatus = "pending" | "approved" | "paid" | "rejected";

function normalizeIban(raw: string) {
  const value = raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
  if (value.startsWith("IR") && value.length === 26) return value;
  if (/^\d{24}$/.test(value)) return `IR${value}`;
  return value;
}

export async function listUserPayoutRequests(userId: string) {
  return prisma.walletPayoutRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function listPendingPayoutRequests() {
  return prisma.walletPayoutRequest.findMany({
    where: { status: { in: ["pending", "approved"] } },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { user: { select: { id: true, fullName: true, phone: true, walletBalance: true } } },
  });
}

export async function requestWalletPayout(input: {
  userId: string;
  amountToman: number;
  bankIban: string;
  bankAccountName: string;
  userNote?: string;
}) {
  const amount = Math.round(input.amountToman);
  if (!Number.isFinite(amount) || amount < 50_000) {
    return { error: "حداقل مبلغ تسویه ۵۰٬۰۰۰ تومان است." as const };
  }

  const iban = normalizeIban(input.bankIban);
  if (!/^IR\d{24}$/.test(iban)) {
    return { error: "شماره شبا معتبر نیست (IR و ۲۴ رقم)." as const };
  }

  const accountName = input.bankAccountName.trim();
  if (accountName.length < 3) {
    return { error: "نام صاحب حساب را وارد کنید." as const };
  }

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return { error: "کاربر پیدا نشد." as const };
  if (user.walletBalance < amount) {
    return { error: "موجودی کیف پول کافی نیست." as const };
  }

  const open = await prisma.walletPayoutRequest.findFirst({
    where: { userId: input.userId, status: { in: ["pending", "approved"] } },
  });
  if (open) {
    return { error: "یک درخواست تسویه باز دارید؛ تا تعیین تکلیف آن صبر کنید." as const };
  }

  const id = randomUUID();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: {
        walletBalance: { decrement: amount },
        bankIban: iban,
        bankAccountName: accountName.slice(0, 120),
      },
    }),
    prisma.walletEntry.create({
      data: {
        userId: input.userId,
        amount: -amount,
        reason: "payout-hold",
        note: "مسدودسازی مبلغ برای درخواست تسویه حساب",
      },
    }),
    prisma.walletPayoutRequest.create({
      data: {
        id,
        userId: input.userId,
        amountToman: amount,
        status: "pending",
        bankIban: iban,
        bankAccountName: accountName.slice(0, 120),
        userNote: input.userNote?.trim().slice(0, 500) || null,
      },
    }),
  ]);

  return { ok: true as const, id };
}

export async function reviewWalletPayout(input: {
  id: string;
  action: "approve" | "reject" | "mark-paid";
  staffNote?: string;
}) {
  const row = await prisma.walletPayoutRequest.findUnique({ where: { id: input.id } });
  if (!row) return { error: "درخواست تسویه پیدا نشد." as const };

  if (input.action === "approve") {
    if (row.status !== "pending") return { error: "این درخواست قابل تأیید نیست." as const };
    await prisma.walletPayoutRequest.update({
      where: { id: row.id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        staffNote: input.staffNote?.trim().slice(0, 1000) || row.staffNote,
      },
    });
    return { ok: true as const };
  }

  if (input.action === "reject") {
    if (row.status !== "pending" && row.status !== "approved") {
      return { error: "این درخواست قابل رد نیست." as const };
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { walletBalance: { increment: row.amountToman } },
      }),
      prisma.walletEntry.create({
        data: {
          userId: row.userId,
          amount: row.amountToman,
          reason: "payout-reject",
          note: "برگشت مبلغ به‌خاطر رد درخواست تسویه",
        },
      }),
      prisma.walletPayoutRequest.update({
        where: { id: row.id },
        data: {
          status: "rejected",
          reviewedAt: new Date(),
          staffNote: input.staffNote?.trim().slice(0, 1000) || "رد توسط مدیریت",
        },
      }),
    ]);
    return { ok: true as const };
  }

  if (row.status !== "approved") {
    return { error: "فقط درخواست‌های تأییدشده را می‌توان پرداخت‌شده علامت زد." as const };
  }

  await prisma.walletPayoutRequest.update({
    where: { id: row.id },
    data: {
      status: "paid",
      paidAt: new Date(),
      staffNote:
        input.staffNote?.trim().slice(0, 1000) ||
        "پرداخت پایا ثبت شد؛ واریز معمولاً ۲ تا ۳ روز کاری طول می‌کشد.",
    },
  });

  return { ok: true as const };
}
