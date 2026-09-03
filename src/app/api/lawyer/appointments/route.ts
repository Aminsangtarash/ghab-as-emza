import { NextResponse, type NextRequest } from "next/server";

import { parseAppointmentKind, parseAppointmentStatus } from "@/lib/appointment-model";
import { createAppointment, listLawyerAppointments } from "@/lib/appointments";
import { asDate, asInt, asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const status = parseAppointmentStatus(request.nextUrl.searchParams.get("status") ?? undefined);
  const scope = request.nextUrl.searchParams.get("scope");
  const items = await listLawyerAppointments(guard.lawyer.lawyerSlug, {
    status,
    from: scope === "upcoming" ? new Date() : undefined,
  });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const body = await readJson(request);

  const kind = parseAppointmentKind(body.kind);
  const scheduledAt = asDate(body.scheduledAt);
  if (!kind) return NextResponse.json({ error: "نوع جلسه را انتخاب کنید." }, { status: 422 });
  if (!scheduledAt) return NextResponse.json({ error: "زمان جلسه را مشخص کنید." }, { status: 422 });

  const result = await createAppointment({
    lawyerSlug: guard.lawyer.lawyerSlug,
    conversationId: asText(body.conversationId, 60),
    caseId: asText(body.caseId, 60),
    userId: asText(body.userId, 60),
    kind,
    scheduledAt,
    minutes: asInt(body.minutes) ?? 30,
    note: asText(body.note, 300),
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result);
}
