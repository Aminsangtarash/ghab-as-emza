import type { Appointment, User } from "@/generated/prisma";

import {
  appointmentKindMeta,
  type AppointmentKind,
  type AppointmentStatus,
  type ClientAppointment,
} from "@/lib/appointment-model";
import { prisma } from "@/lib/db";
import { formatFaDateTime } from "@/lib/format";

type AppointmentRow = Appointment & {
  user?: Pick<User, "fullName" | "phone"> | null;
  conversation?: { id: string; consultation: { trackingCode: string; subject: string } } | null;
};

const appointmentInclude = {
  user: { select: { fullName: true, phone: true } },
  conversation: {
    select: { id: true, consultation: { select: { trackingCode: true, subject: true } } },
  },
} as const;

export async function createAppointment(input: {
  lawyerSlug: string;
  conversationId?: string;
  caseId?: string;
  userId?: string;
  kind: AppointmentKind;
  scheduledAt: Date;
  minutes: number;
  note?: string;
}) {
  if (Number.isNaN(input.scheduledAt.getTime())) {
    return { error: "زمان نوبت معتبر نیست." as const };
  }
  if (input.minutes < 5 || input.minutes > 480) {
    return { error: "مدت جلسه بین ۵ تا ۴۸۰ دقیقه باشد." as const };
  }

  let userId = input.userId;
  if (input.conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: input.conversationId, lawyerSlug: input.lawyerSlug },
    });
    if (!conversation) return { error: "گفتگو پیدا نشد." as const };
    userId = conversation.userId;
  }
  if (input.caseId && !userId) {
    const row = await prisma.case.findFirst({
      where: { id: input.caseId, lawyerSlug: input.lawyerSlug },
    });
    if (!row) return { error: "پرونده پیدا نشد." as const };
    userId = row.userId;
  }
  if (!userId) return { error: "موکل نوبت مشخص نیست." as const };

  const created = await prisma.appointment.create({
    data: {
      userId,
      lawyerSlug: input.lawyerSlug,
      conversationId: input.conversationId ?? null,
      caseId: input.caseId ?? null,
      kind: input.kind,
      scheduledAt: input.scheduledAt,
      minutes: Math.round(input.minutes),
      note: input.note?.trim()?.slice(0, 300) || null,
      status: "scheduled",
    },
  });

  const label = `${appointmentKindMeta[input.kind]} برای ${formatFaDateTime(created.scheduledAt.toISOString())}`;
  if (input.conversationId) {
    await prisma.message.create({
      data: {
        conversationId: input.conversationId,
        authorRole: "system",
        body: `وکیل نوبتی ثبت کرد: ${label}.${created.note ? ` توضیح: ${created.note}` : ""}`,
      },
    });
  }
  if (input.caseId) {
    await prisma.caseEvent.create({
      data: {
        caseId: input.caseId,
        kind: "hearing",
        title: label,
        body: created.note,
        happensAt: created.scheduledAt,
        authorRole: "lawyer",
        visibleToClient: true,
      },
    });
  }

  return { ok: true as const, appointmentId: created.id };
}

export async function listLawyerAppointments(
  lawyerSlug: string,
  options: { status?: AppointmentStatus; from?: Date; take?: number } = {},
) {
  const rows = await prisma.appointment.findMany({
    where: {
      lawyerSlug,
      ...(options.status ? { status: options.status } : {}),
      ...(options.from ? { scheduledAt: { gte: options.from } } : {}),
    },
    include: appointmentInclude,
    orderBy: { scheduledAt: "asc" },
    take: options.take,
  });
  return rows.map(toClientAppointment);
}

export async function listUserAppointments(userId: string, take = 20) {
  const rows = await prisma.appointment.findMany({
    where: { userId, status: { in: ["scheduled", "done"] } },
    include: appointmentInclude,
    orderBy: { scheduledAt: "asc" },
    take,
  });
  return rows.map(toClientAppointment);
}

export async function updateAppointment(
  lawyerSlug: string,
  appointmentId: string,
  patch: { status?: AppointmentStatus; scheduledAt?: Date; minutes?: number; note?: string },
) {
  const row = await prisma.appointment.findFirst({ where: { id: appointmentId, lawyerSlug } });
  if (!row) return { error: "نوبت پیدا نشد." as const };

  const updated = await prisma.appointment.update({
    where: { id: row.id },
    data: {
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.scheduledAt ? { scheduledAt: patch.scheduledAt } : {}),
      ...(patch.minutes ? { minutes: Math.round(patch.minutes) } : {}),
      ...(patch.note !== undefined ? { note: patch.note.trim().slice(0, 300) || null } : {}),
    },
  });

  if (patch.status === "done" && row.conversationId && updated.kind === "phone") {
    const conversation = await prisma.conversation.findUnique({ where: { id: row.conversationId } });
    if (conversation && !conversation.phoneCallDoneAt) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { phoneCallDoneAt: new Date() },
      });
    }
  }

  return { ok: true as const };
}

export async function countUpcomingAppointments(lawyerSlug: string) {
  const now = new Date();
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);
  const [today, upcoming] = await Promise.all([
    prisma.appointment.count({
      where: { lawyerSlug, status: "scheduled", scheduledAt: { gte: now, lte: dayEnd } },
    }),
    prisma.appointment.count({
      where: { lawyerSlug, status: "scheduled", scheduledAt: { gte: now } },
    }),
  ]);
  return { today, upcoming };
}

function toClientAppointment(row: AppointmentRow): ClientAppointment {
  return {
    id: row.id,
    kind: row.kind as AppointmentKind,
    status: row.status as AppointmentStatus,
    scheduledAt: row.scheduledAt.toISOString(),
    minutes: row.minutes,
    note: row.note ?? undefined,
    clientName: row.user?.fullName ?? "موکل",
    clientPhone: row.user?.phone,
    conversationId: row.conversationId ?? undefined,
    caseId: row.caseId ?? undefined,
    trackingCode: row.conversation?.consultation.trackingCode,
    subject: row.conversation?.consultation.subject,
  };
}
