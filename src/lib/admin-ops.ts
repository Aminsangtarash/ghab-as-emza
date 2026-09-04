import "server-only";

import { createHash, randomBytes } from "crypto";

import { hashPassword } from "@/lib/auth";
import { PRIMARY_MANAGER_PHONE } from "@/lib/admin-permissions";
import {
  consultChannelMeta,
  consultationStatusMeta,
  lawyerLabel,
  serviceTitle,
  type ConsultChannel,
  type ConsultationStatus,
} from "@/lib/consult";
import { lawyers, services, type Lawyer } from "@/lib/data";
import { prisma } from "@/lib/db";
import { promoCodes as defaultPromos } from "@/lib/promos";
import {
  getCustomLawyerCache,
  getFeeCache,
  resolveLawyer,
  resolvePromos,
  setCustomLawyerCache,
  setFeeCache,
  setPromoCache,
} from "@/lib/catalog-cache";
import { countActiveLawyers, writeUserActive } from "@/lib/user-active";

function safeFocus(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).slice(0, 12) : [];
  } catch {
    return [];
  }
}

export async function refreshAdminCaches() {
  try {
    const customs = await prisma.lawyerProfile.findMany({ where: { isCustom: true, active: true } });
    setCustomLawyerCache(
      customs.map((row) => ({
        slug: row.slug,
        name: row.displayName || row.slug,
        title: row.title || "وکیل",
        specialty: row.specialty || "عمومی",
        experience: row.experience || "—",
        years: row.years ?? 1,
        city: row.city || "—",
        rating: row.rating ?? 5,
        consultations: row.consultations ?? 0,
        image: row.image || "/images/lawyers/sara-mohammadi-official.jpg",
        bio: row.bio || "",
        focus: safeFocus(row.focusJson),
      })),
    );
  } catch {
    setCustomLawyerCache([]);
  }

  try {
    const fees = await prisma.serviceFee.findMany();
    let nextFees = Object.fromEntries(fees.map((f) => [f.serviceSlug, f.feeToman]));
    if (fees.length === 0) {
      await prisma.serviceFee.createMany({
        data: services.map((s) => ({ serviceSlug: s.slug, feeToman: s.feeToman })),
        skipDuplicates: true,
      });
      nextFees = Object.fromEntries(services.map((s) => [s.slug, s.feeToman]));
    }
    setFeeCache(nextFees);
  } catch {
    setFeeCache(Object.fromEntries(services.map((s) => [s.slug, s.feeToman])));
  }

  try {
    const promos = await prisma.promoCode.findMany({ orderBy: { code: "asc" } });
    if (promos.length === 0) {
      await prisma.promoCode.createMany({
        data: defaultPromos.map((p) => ({ code: p.code, percent: p.percent, title: p.title, active: true })),
        skipDuplicates: true,
      });
      setPromoCache(defaultPromos.map((p) => ({ ...p, active: true })));
    } else {
      setPromoCache(
        promos.map((p) => ({
          code: p.code,
          percent: p.percent,
          title: p.title,
          active: p.active,
        })),
      );
    }
  } catch {
    setPromoCache(defaultPromos.map((p) => ({ ...p, active: true })));
  }
}

export function getCachedCustomLawyers() {
  return getCustomLawyerCache();
}

export function getCachedFee(serviceSlug: string) {
  return getFeeCache()[serviceSlug];
}

export function getCachedPromos(activeOnly = true) {
  return resolvePromos(activeOnly);
}

export function getLawyerFromDirectory(slug: string): Lawyer | undefined {
  return resolveLawyer(slug);
}

export async function listMergedLawyers(): Promise<Lawyer[]> {
  await refreshAdminCaches();
  const disabled = await prisma.lawyerProfile.findMany({
    where: { active: false },
    select: { slug: true },
  });
  const disabledSet = new Set(disabled.map((d) => d.slug));
  const custom = getCustomLawyerCache();
  const customSlugs = new Set(custom.map((l) => l.slug));
  const staticOnes = lawyers.filter((l) => !disabledSet.has(l.slug) && !customSlugs.has(l.slug));
  return [...staticOnes, ...custom];
}

export async function getAdminDashboard() {
  await refreshAdminCaches();
  const { countOpenSupportTickets } = await import("@/lib/support-tickets");
  const { countPendingCooperations } = await import("@/lib/cooperation");

  const [
    clientCount,
    lawyerCount,
    staffCount,
    consultCount,
    openChats,
    awaitingOperator,
    urgentWaiting,
    walletSum,
    cancelledCount,
    refundedCount,
    inProgressCount,
    closedCount,
    ratingAgg,
    recentWallet,
    recent,
    openTickets,
    pendingCooperations,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "client" } }),
    countActiveLawyers(),
    prisma.user.count({ where: { role: { in: ["admin", "manager"] } } }),
    prisma.consultation.count(),
    prisma.conversation.count({ where: { closedAt: null } }),
    prisma.consultation.count({ where: { status: "awaiting-operator" } }),
    prisma.consultation.count({
      where: { status: "awaiting-lawyer", service: "urgent-consult", lawyerSlug: null },
    }),
    prisma.user.aggregate({ _sum: { walletBalance: true }, where: { role: "client" } }),
    prisma.consultation.count({ where: { status: "cancelled" } }),
    prisma.consultation.count({ where: { paymentStatus: "refunded-wallet" } }),
    prisma.consultation.count({ where: { status: "in-progress" } }),
    prisma.consultation.count({ where: { status: "closed" } }),
    prisma.rating.aggregate({ _avg: { score: true }, _count: { _all: true } }),
    prisma.walletEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        amount: true,
        reason: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    }),
    prisma.consultation.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        trackingCode: true,
        status: true,
        channel: true,
        service: true,
        createdAt: true,
        city: true,
      },
    }),
    countOpenSupportTickets(),
    countPendingCooperations(),
  ]);

  const byStatus = await prisma.consultation.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const qualityAlerts = await listLawyerQualityAlerts().catch(() => []);

  return {
    clientCount,
    lawyerCount,
    staffCount,
    consultCount,
    openChats,
    awaitingOperator,
    urgentWaiting,
    walletSum: walletSum._sum.walletBalance ?? 0,
    cancelledCount,
    refundedCount,
    inProgressCount,
    closedCount,
    openTickets,
    pendingCooperations,
    avgRating: ratingAgg._avg.score ?? 0,
    ratingCount: ratingAgg._count._all,
    qualityAlerts,
    statusBreakdown: byStatus.map((row) => ({
      status: row.status,
      label: consultationStatusMeta[row.status as ConsultationStatus]?.title ?? row.status,
      count: row._count._all,
    })),
    recentWallet: recentWallet.map((row) => ({
      amount: row.amount,
      reason: row.reason,
      userName: row.user.fullName,
      createdAt: row.createdAt.toISOString(),
    })),
    recent: recent.map((item) => ({
      trackingCode: item.trackingCode,
      status: item.status,
      statusLabel: consultationStatusMeta[item.status as ConsultationStatus]?.title ?? item.status,
      channel: item.channel,
      channelLabel: consultChannelMeta[item.channel as ConsultChannel]?.title ?? item.channel,
      serviceTitle: serviceTitle(item.service),
      city: item.city,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export async function listOpsQueue() {
  const rows = await prisma.consultation.findMany({
    where: {
      status: { in: ["awaiting-operator", "awaiting-lawyer"] },
      OR: [{ lawyerSlug: null }, { status: "awaiting-operator" }],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      trackingCode: true,
      status: true,
      channel: true,
      service: true,
      subject: true,
      city: true,
      lawyerMode: true,
      lawyerSlug: true,
      feeToman: true,
      paymentStatus: true,
      createdAt: true,
      urgency: true,
      fullName: true,
      phone: true,
    },
  });

  return rows.map((row) => ({
    trackingCode: row.trackingCode,
    status: row.status,
    statusLabel: consultationStatusMeta[row.status as ConsultationStatus]?.title ?? row.status,
    channel: row.channel,
    channelLabel: consultChannelMeta[row.channel as ConsultChannel]?.title ?? row.channel,
    service: row.service,
    serviceTitle: serviceTitle(row.service),
    subject: row.subject,
    city: row.city,
    lawyerMode: row.lawyerMode,
    lawyerSlug: row.lawyerSlug,
    lawyerName: lawyerLabel(row.lawyerSlug ?? undefined) ?? getLawyerFromDirectory(row.lawyerSlug ?? "")?.name,
    feeToman: row.feeToman,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt.toISOString(),
    urgency: row.urgency,
    clientName: row.fullName,
    clientPhone: row.phone,
  }));
}

export async function assignConsultationLawyer(trackingCode: string, lawyerSlug: string) {
  await refreshAdminCaches();
  const lawyer = getLawyerFromDirectory(lawyerSlug);
  if (!lawyer) return { error: "وکیل پیدا نشد." as const };

  const account = await prisma.user.findFirst({ where: { lawyerSlug, role: "lawyer" } });
  if (!account) return { error: "حساب فعال برای این وکیل وجود ندارد." as const };
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ active: number | boolean }>>(
      `SELECT active FROM User WHERE id = ? LIMIT 1`,
      account.id,
    );
    const active = rows[0]?.active;
    if (active === false || active === 0) {
      return { error: "حساب فعال برای این وکیل وجود ندارد." as const };
    }
  } catch {
    /* ستون active در کلاینت قدیمی نادیده گرفته می‌شود */
  }

  const row = await prisma.consultation.findUnique({ where: { trackingCode } });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status === "cancelled" || row.status === "closed" || row.status === "in-progress") {
    return { error: "این درخواست قابل انتساب نیست." as const };
  }

  await prisma.consultation.update({
    where: { id: row.id },
    data: {
      lawyerSlug,
      lawyerMode: "chosen",
      lawyerVisible: false,
      status: "awaiting-lawyer",
    },
  });

  return { ok: true as const };
}

export async function adminCancelConsultation(trackingCode: string, reason?: string) {
  const row = await prisma.consultation.findUnique({ where: { trackingCode } });
  if (!row) return { error: "درخواست پیدا نشد." as const };
  if (row.status === "cancelled" || row.status === "closed") {
    return { error: "این درخواست قبلاً بسته یا لغو شده است." as const };
  }
  if (row.status === "in-progress") {
    return { error: "گفتگوی فعال را ابتدا وکیل باید ببندد." as const };
  }

  await prisma.consultation.update({
    where: { id: row.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason?.trim() || "لغو توسط مدیریت",
    },
  });

  if (row.paymentStatus === "stub-paid" && row.feeToman > 0 && row.refundedToman <= 0) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { walletBalance: { increment: row.feeToman } },
      }),
      prisma.walletEntry.create({
        data: {
          userId: row.userId,
          amount: row.feeToman,
          reason: "refund",
          consultationId: row.id,
          note: "استرداد توسط مدیریت",
        },
      }),
      prisma.consultation.update({
        where: { id: row.id },
        data: { paymentStatus: "refunded-wallet", refundedToman: row.feeToman },
      }),
    ]);
    return { ok: true as const, refunded: row.feeToman };
  }

  return { ok: true as const, refunded: 0 };
}

export async function getConsultationForStaff(trackingCode: string, includeSecrets: boolean) {
  const row = await prisma.consultation.findUnique({
    where: { trackingCode },
    include: {
      user: { select: { id: true, fullName: true, phone: true, walletBalance: true } },
      conversation: includeSecrets
        ? { include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } } }
        : true,
      documents: { select: { id: true, originalName: true, size: true, createdAt: true } },
    },
  });
  if (!row) return null;

  return {
    trackingCode: row.trackingCode,
    status: row.status,
    statusLabel: consultationStatusMeta[row.status as ConsultationStatus]?.title ?? row.status,
    channel: row.channel,
    channelLabel: consultChannelMeta[row.channel as ConsultChannel]?.title ?? row.channel,
    service: row.service,
    serviceTitle: serviceTitle(row.service),
    subject: row.subject,
    city: row.city,
    lawyerMode: row.lawyerMode,
    lawyerSlug: row.lawyerSlug,
    lawyerName: lawyerLabel(row.lawyerSlug ?? undefined) ?? getLawyerFromDirectory(row.lawyerSlug ?? "")?.name,
    feeToman: row.feeToman,
    originalFeeToman: row.originalFeeToman,
    discountCode: row.discountCode,
    paymentStatus: row.paymentStatus,
    urgency: row.urgency,
    caseStage: row.caseStage,
    preferredSlot: row.preferredSlot,
    hasDocuments: row.hasDocuments,
    createdAt: row.createdAt.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString(),
    cancelReason: row.cancelReason,
    refundedToman: row.refundedToman,
    client: {
      id: row.user.id,
      fullName: row.user.fullName,
      phone: row.user.phone,
      walletBalance: row.user.walletBalance,
    },
    documents: row.documents.map((d) => ({
      id: d.id,
      originalName: d.originalName,
      size: d.size,
      createdAt: d.createdAt.toISOString(),
    })),
    secrets: includeSecrets
      ? {
          message: row.message,
          messages:
            row.conversation && "messages" in row.conversation
              ? (
                  row.conversation.messages as Array<{
                    id: string;
                    authorRole: string;
                    body: string;
                    createdAt: Date;
                  }>
                ).map((m) => ({
                  id: m.id,
                  authorRole: m.authorRole,
                  body: m.body,
                  createdAt: m.createdAt.toISOString(),
                }))
              : [],
        }
      : undefined,
  };
}

export async function listAdminUsers(input?: {
  q?: string;
  active?: "all" | "active" | "inactive";
  wallet?: "all" | "positive";
  openRequest?: boolean;
}) {
  const q = input?.q?.trim();
  const users = await prisma.user.findMany({
    where: {
      role: "client",
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
      ...(input?.wallet === "positive" ? { walletBalance: { gt: 0 } } : {}),
      ...(input?.openRequest
        ? {
            consultations: {
              some: { status: { in: ["awaiting-operator", "awaiting-lawyer", "in-progress"] } },
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 150,
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      walletBalance: true,
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          consultations: true,
          conversations: true,
          cases: true,
        },
      },
    },
  });

  const activeMap = new Map<string, boolean>();
  try {
    const ids = users.map((u) => u.id);
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string; active: number | boolean }>>(
        `SELECT id, active FROM User WHERE id IN (${placeholders})`,
        ...ids,
      );
      for (const row of rows) {
        activeMap.set(row.id, row.active === true || row.active === 1);
      }
    }
  } catch {
    /* ignore */
  }

  let mapped = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    phone: u.phone,
    email: u.email,
    walletBalance: u.walletBalance,
    active: activeMap.get(u.id) ?? true,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString(),
    consultations: u._count.consultations,
    conversations: u._count.conversations,
    cases: u._count.cases,
  }));

  if (input?.active === "active") mapped = mapped.filter((u) => u.active);
  if (input?.active === "inactive") mapped = mapped.filter((u) => !u.active);

  return mapped;
}

export async function getAdminUserDetail(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: "client" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      address: true,
      walletBalance: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
  if (!user) return null;

  let active = true;
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ active: number | boolean }>>(
      `SELECT active FROM User WHERE id = ? LIMIT 1`,
      userId,
    );
    active = rows[0]?.active === true || rows[0]?.active === 1 || rows[0]?.active === undefined;
  } catch {
    /* ignore */
  }

  const [consultations, conversations, cases, walletEntries, openTickets] = await Promise.all([
    prisma.consultation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        trackingCode: true,
        subject: true,
        status: true,
        service: true,
        feeToman: true,
        createdAt: true,
      },
    }),
    prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        lawyerSlug: true,
        closedAt: true,
        createdAt: true,
        consultation: { select: { subject: true, trackingCode: true } },
      },
    }),
    prisma.case.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        caseNumber: true,
        title: true,
        status: true,
        lawyerSlug: true,
        updatedAt: true,
      },
    }),
    prisma.walletEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, amount: true, reason: true, note: true, createdAt: true },
    }),
    prisma.$queryRawUnsafe<Array<{ c: bigint | number }>>(
      `SELECT COUNT(*) AS c FROM SupportTicket WHERE phone = ? AND status IN ('new','in-progress')`,
      user.phone,
    ).catch(() => [{ c: 0 }]),
  ]);

  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    address: user.address,
    walletBalance: user.walletBalance,
    active,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
    openSupportTickets: Number(openTickets[0]?.c ?? 0),
    consultations: consultations.map((c) => ({
      trackingCode: c.trackingCode,
      subject: c.subject,
      status: c.status,
      statusLabel: consultationStatusMeta[c.status as ConsultationStatus]?.title ?? c.status,
      serviceTitle: serviceTitle(c.service),
      feeToman: c.feeToman,
      createdAt: c.createdAt.toISOString(),
    })),
    conversations: conversations.map((c) => ({
      id: c.id,
      subject: c.consultation.subject,
      trackingCode: c.consultation.trackingCode,
      lawyerName: lawyerLabel(c.lawyerSlug) ?? getLawyerFromDirectory(c.lawyerSlug)?.name ?? c.lawyerSlug,
      closedAt: c.closedAt?.toISOString(),
      createdAt: c.createdAt.toISOString(),
    })),
    cases: cases.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      title: c.title,
      status: c.status,
      lawyerName: lawyerLabel(c.lawyerSlug) ?? getLawyerFromDirectory(c.lawyerSlug)?.name ?? c.lawyerSlug,
      updatedAt: c.updatedAt.toISOString(),
    })),
    walletEntries: walletEntries.map((e) => ({
      id: e.id,
      amount: e.amount,
      reason: e.reason,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export async function resetClientPassword(userId: string, password: string) {
  if (password.length < 6) return { error: "رمز عبور حداقل ۶ کاراکتر باشد." as const };
  const user = await prisma.user.findFirst({ where: { id: userId, role: "client" } });
  if (!user) return { error: "کاربر پیدا نشد." as const };
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(password) },
  });
  await prisma.session.deleteMany({ where: { userId } });
  return { ok: true as const };
}

export async function setUserActive(userId: string, active: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "کاربر پیدا نشد." as const };
  if (user.role === "manager" && user.phone === PRIMARY_MANAGER_PHONE && !active) {
    return { error: "مدیر اول قابل غیرفعال‌سازی نیست." as const };
  }
  await writeUserActive(userId, active);
  if (!active) await prisma.session.deleteMany({ where: { userId } });
  return { ok: true as const };
}

export async function adjustUserWallet(input: {
  userId: string;
  amount: number;
  note?: string;
  actorName: string;
}) {
  if (!Number.isFinite(input.amount) || input.amount === 0) {
    return { error: "مبلغ نامعتبر است." as const };
  }
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return { error: "کاربر پیدا نشد." as const };
  if (user.walletBalance + input.amount < 0) {
    return { error: "موجودی کافی نیست." as const };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.user.update({
      where: { id: input.userId },
      data: { walletBalance: { increment: input.amount } },
    });
    await tx.walletEntry.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        reason: input.amount > 0 ? "admin-credit" : "admin-debit",
        note: (input.note?.trim() || `تعدیل توسط ${input.actorName}`).slice(0, 200),
      },
    });
    return next;
  });

  return { ok: true as const, walletBalance: updated.walletBalance };
}

export async function listStaffAccounts() {
  const rows = await prisma.user.findMany({
    where: { role: { in: ["admin", "manager"] } },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      fullName: true,
      phone: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  const activeMap = new Map<string, boolean>();
  try {
    const ids = rows.map((r) => r.id);
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      const activeRows = await prisma.$queryRawUnsafe<Array<{ id: string; active: number | boolean }>>(
        `SELECT id, active FROM User WHERE id IN (${placeholders})`,
        ...ids,
      );
      for (const row of activeRows) {
        activeMap.set(row.id, row.active === true || row.active === 1);
      }
    }
  } catch {
    /* ignore */
  }

  return rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    phone: r.phone,
    role: r.role,
    active: activeMap.get(r.id) ?? true,
    createdAt: r.createdAt.toISOString(),
    lastLoginAt: r.lastLoginAt?.toISOString(),
    isPrimary: r.phone === PRIMARY_MANAGER_PHONE,
  }));
}

export async function createStaffAccount(input: {
  fullName: string;
  phone: string;
  password: string;
  role: "admin" | "manager";
}) {
  const phone = input.phone.trim();
  const fullName = input.fullName.trim();
  if (!fullName || fullName.length < 3) return { error: "نام معتبر نیست." as const };
  if (!/^09\d{9}$/.test(phone)) return { error: "شماره موبایل معتبر نیست." as const };
  if (input.password.length < 6) return { error: "رمز عبور حداقل ۶ کاراکتر باشد." as const };

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return { error: "این شماره قبلاً ثبت شده است." as const };

  const user = await prisma.user.create({
    data: {
      fullName,
      phone,
      passwordHash: hashPassword(input.password),
      role: input.role,
    },
  });
  await writeUserActive(user.id, true).catch(() => undefined);

  return {
    ok: true as const,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      active: true,
    },
  };
}

export async function resetStaffPassword(userId: string, password: string) {
  if (password.length < 6) return { error: "رمز عبور حداقل ۶ کاراکتر باشد." as const };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return { error: "حساب کارکنان پیدا نشد." as const };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(password) },
  });
  await prisma.session.deleteMany({ where: { userId } });
  return { ok: true as const };
}

function slugifyLawyerName(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, "")
    .slice(0, 40);
  const suffix = randomBytes(3).toString("hex");
  return `${base || "lawyer"}-${suffix}`;
}

export async function createLawyerAccount(input: {
  fullName: string;
  phone: string;
  password: string;
  city: string;
  specialty: string;
  title?: string;
  bio?: string;
}) {
  const phone = input.phone.trim();
  const fullName = input.fullName.trim();
  if (!fullName || fullName.length < 3) return { error: "نام وکیل معتبر نیست." as const };
  if (!/^09\d{9}$/.test(phone)) return { error: "شماره موبایل معتبر نیست." as const };
  if (input.password.length < 6) return { error: "رمز عبور حداقل ۶ کاراکتر باشد." as const };
  if (!input.city.trim()) return { error: "شهر الزامی است." as const };
  if (!input.specialty.trim()) return { error: "تخصص الزامی است." as const };

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return { error: "این شماره قبلاً ثبت شده است." as const };

  const slug = slugifyLawyerName(fullName);
  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        fullName,
        phone,
        passwordHash: hashPassword(input.password),
        role: "lawyer",
        lawyerSlug: slug,
      },
    });
    await tx.lawyerProfile.create({
      data: {
        slug,
        isCustom: true,
        active: true,
        displayName: fullName,
        title: input.title?.trim() || "وکیل پایه یک دادگستری",
        specialty: input.specialty.trim(),
        city: input.city.trim(),
        experience: "جدید",
        years: 1,
        bio: input.bio?.trim() || null,
        image: "/images/lawyers/sara-mohammadi-official.jpg",
        focusJson: JSON.stringify([input.specialty.trim()]),
        acceptingNew: true,
      },
    });
  });

  const created = await prisma.user.findFirst({ where: { lawyerSlug: slug } });
  if (created) await writeUserActive(created.id, true).catch(() => undefined);

  await refreshAdminCaches();
  return { ok: true as const, slug };
}

export async function setLawyerActive(slug: string, active: boolean) {
  const user = await prisma.user.findFirst({ where: { lawyerSlug: slug, role: "lawyer" } });
  if (!user) return { error: "وکیل پیدا نشد." as const };

  await writeUserActive(user.id, active);
  await prisma.lawyerProfile.upsert({
    where: { slug },
    create: { slug, active, isCustom: false },
    update: { active },
  });
  if (!active) await prisma.session.deleteMany({ where: { userId: user.id } });
  await refreshAdminCaches();
  return { ok: true as const };
}

export async function setLawyerAccepting(slug: string, acceptingNew: boolean) {
  const user = await prisma.user.findFirst({ where: { lawyerSlug: slug, role: "lawyer" } });
  if (!user) return { error: "وکیل پیدا نشد." as const };
  await prisma.lawyerProfile.upsert({
    where: { slug },
    create: { slug, acceptingNew, isCustom: false },
    update: { acceptingNew },
  });
  return { ok: true as const };
}

export async function listAdminLawyers() {
  await refreshAdminCaches();
  const accounts = await prisma.user.findMany({
    where: { role: "lawyer" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      lawyerSlug: true,
      createdAt: true,
    },
  });
  const profiles = await prisma.lawyerProfile.findMany();
  const profileMap = new Map(profiles.map((p) => [p.slug, p]));

  const activeMap = new Map<string, boolean>();
  try {
    const ids = accounts.map((a) => a.id);
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string; active: number | boolean }>>(
        `SELECT id, active FROM User WHERE id IN (${placeholders})`,
        ...ids,
      );
      for (const row of rows) {
        activeMap.set(row.id, row.active === true || row.active === 1);
      }
    }
  } catch {
    /* ignore */
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const enriched = await Promise.all(
    accounts.map(async (account) => {
      const slug = account.lawyerSlug ?? "";
      const dir = getLawyerFromDirectory(slug);
      const profile = profileMap.get(slug);
      const userActive = activeMap.get(account.id) ?? true;

      const [openChats, acceptsWeek, acceptsDay, ratings, cancelledAssigned, feeSum] = await Promise.all([
        prisma.conversation.count({ where: { lawyerSlug: slug, closedAt: null } }),
        prisma.consultation.count({
          where: {
            lawyerSlug: slug,
            status: { in: ["in-progress", "closed"] },
            createdAt: { gte: weekAgo },
          },
        }),
        prisma.consultation.count({
          where: {
            lawyerSlug: slug,
            status: { in: ["in-progress", "closed"] },
            createdAt: { gte: dayAgo },
          },
        }),
        prisma.rating.aggregate({
          where: { conversation: { lawyerSlug: slug } },
          _avg: { score: true },
          _count: { _all: true },
        }),
        prisma.consultation.count({
          where: { lawyerSlug: slug, status: "cancelled" },
        }),
        prisma.consultation.aggregate({
          where: { lawyerSlug: slug, status: { in: ["in-progress", "closed"] }, paymentStatus: "stub-paid" },
          _sum: { feeToman: true },
        }),
      ]);

      const done = acceptsWeek + cancelledAssigned;
      const rejectRate = done > 0 ? Math.round((cancelledAssigned / Math.max(done, 1)) * 100) : 0;
      const avgRating = ratings._avg.score ?? 0;
      const lowQuality = (ratings._count._all >= 3 && avgRating > 0 && avgRating < 3.2) || rejectRate >= 40;

      return {
        id: account.id,
        slug,
        fullName: account.fullName,
        phone: account.phone,
        active: userActive && (profile?.active ?? true),
        acceptingNew: profile?.acceptingNew ?? true,
        city: profile?.city ?? dir?.city,
        specialty: profile?.specialty ?? dir?.specialty,
        isCustom: profile?.isCustom ?? false,
        createdAt: account.createdAt.toISOString(),
        openChats,
        acceptsToday: acceptsDay,
        acceptsWeek,
        avgRating,
        ratingCount: ratings._count._all,
        rejectRate,
        earningsToman: feeSum._sum.feeToman ?? 0,
        lowQuality,
        overCapacity: openChats >= 8,
      };
    }),
  );

  return enriched.sort((a, b) => b.acceptsWeek - a.acceptsWeek || b.avgRating - a.avgRating);
}

export async function getAdminLawyerDetail(slug: string) {
  await refreshAdminCaches();
  const account = await prisma.user.findFirst({
    where: { role: "lawyer", lawyerSlug: slug },
    select: { id: true, fullName: true, phone: true, lawyerSlug: true, createdAt: true, lastLoginAt: true },
  });
  if (!account || !account.lawyerSlug) return null;

  const profile = await prisma.lawyerProfile.findUnique({ where: { slug } });
  const dir = getLawyerFromDirectory(slug);

  let active = true;
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ active: number | boolean }>>(
      `SELECT active FROM User WHERE id = ? LIMIT 1`,
      account.id,
    );
    active = rows[0]?.active === true || rows[0]?.active === 1 || rows[0]?.active === undefined;
  } catch {
    /* ignore */
  }

  const [openConversations, recentConsults, ratings, appointments, notes] = await Promise.all([
    prisma.conversation.findMany({
      where: { lawyerSlug: slug, closedAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        user: { select: { fullName: true } },
        consultation: { select: { subject: true, trackingCode: true } },
      },
    }),
    prisma.consultation.findMany({
      where: { lawyerSlug: slug },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        trackingCode: true,
        subject: true,
        status: true,
        feeToman: true,
        createdAt: true,
      },
    }),
    prisma.rating.findMany({
      where: { conversation: { lawyerSlug: slug } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        score: true,
        comment: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { lawyerSlug: slug },
      orderBy: { scheduledAt: "desc" },
      take: 15,
      select: {
        id: true,
        kind: true,
        scheduledAt: true,
        status: true,
        user: { select: { fullName: true } },
      },
    }),
    prisma.lawyerNote.count({ where: { lawyerSlug: slug } }),
  ]);

  const ratingAgg = await prisma.rating.aggregate({
    where: { conversation: { lawyerSlug: slug } },
    _avg: { score: true },
    _count: { _all: true },
  });

  return {
    id: account.id,
    slug,
    fullName: account.fullName,
    phone: account.phone,
    active: active && (profile?.active ?? true),
    acceptingNew: profile?.acceptingNew ?? true,
    city: profile?.city ?? dir?.city,
    specialty: profile?.specialty ?? dir?.specialty,
    title: profile?.title ?? dir?.title,
    bio: profile?.bio ?? dir?.bio,
    isCustom: profile?.isCustom ?? false,
    createdAt: account.createdAt.toISOString(),
    lastLoginAt: account.lastLoginAt?.toISOString(),
    avgRating: ratingAgg._avg.score ?? 0,
    ratingCount: ratingAgg._count._all,
    notesCount: notes,
    openConversations: openConversations.map((c) => ({
      id: c.id,
      clientName: c.user.fullName,
      subject: c.consultation.subject,
      trackingCode: c.consultation.trackingCode,
      createdAt: c.createdAt.toISOString(),
    })),
    recentConsults: recentConsults.map((c) => ({
      trackingCode: c.trackingCode,
      subject: c.subject,
      statusLabel: consultationStatusMeta[c.status as ConsultationStatus]?.title ?? c.status,
      feeToman: c.feeToman,
      createdAt: c.createdAt.toISOString(),
    })),
    ratings: ratings.map((r) => ({
      score: r.score,
      comment: r.comment,
      clientName: r.user.fullName,
      createdAt: r.createdAt.toISOString(),
    })),
    appointments: appointments.map((a) => ({
      id: a.id,
      kind: a.kind,
      status: a.status,
      clientName: a.user.fullName,
      scheduledAt: a.scheduledAt.toISOString(),
    })),
  };
}

export async function listLawyerQualityAlerts() {
  const lawyers = await listAdminLawyers();
  return lawyers
    .filter((l) => l.lowQuality || l.overCapacity)
    .map((l) => ({
      slug: l.slug,
      fullName: l.fullName,
      lowQuality: l.lowQuality,
      overCapacity: l.overCapacity,
      avgRating: l.avgRating,
      rejectRate: l.rejectRate,
      openChats: l.openChats,
    }));
}

export async function upsertPromo(input: { code: string; percent: number; title: string; active?: boolean }) {
  const code = input.code.trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return { error: "کد تخفیف الزامی است." as const };
  if (input.percent < 1 || input.percent > 90) return { error: "درصد باید بین ۱ تا ۹۰ باشد." as const };
  const title = input.title.trim() || `تخفیف ${input.percent} درصد`;

  await prisma.promoCode.upsert({
    where: { code },
    create: { code, percent: input.percent, title, active: input.active ?? true },
    update: { percent: input.percent, title, active: input.active ?? true },
  });
  await refreshAdminCaches();
  return { ok: true as const };
}

export async function setPromoActive(code: string, active: boolean) {
  await prisma.promoCode.update({ where: { code }, data: { active } });
  await refreshAdminCaches();
  return { ok: true as const };
}

export async function listAdminPromos() {
  await refreshAdminCaches();
  return getCachedPromos(false);
}

export async function listAdminFees() {
  await refreshAdminCaches();
  const fees = getFeeCache();
  return services.map((s) => ({
    serviceSlug: s.slug,
    title: s.title,
    feeToman: fees[s.slug] ?? s.feeToman,
  }));
}

export async function setServiceFee(serviceSlug: string, feeToman: number) {
  if (!services.some((s) => s.slug === serviceSlug)) return { error: "سرویس نامعتبر است." as const };
  if (!Number.isFinite(feeToman) || feeToman < 0) return { error: "مبلغ نامعتبر است." as const };
  await prisma.serviceFee.upsert({
    where: { serviceSlug },
    create: { serviceSlug, feeToman: Math.round(feeToman) },
    update: { feeToman: Math.round(feeToman) },
  });
  await refreshAdminCaches();
  return { ok: true as const };
}

export function shortId(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 8);
}
