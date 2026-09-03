import { NextResponse, type NextRequest } from "next/server";

import { parseAppointmentStatus } from "@/lib/appointment-model";
import { updateAppointment } from "@/lib/appointments";
import { asDate, asInt, asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const { id } = await context.params;
  const body = await readJson(request);

  const result = await updateAppointment(guard.lawyer.lawyerSlug, id, {
    status: parseAppointmentStatus(body.status),
    scheduledAt: asDate(body.scheduledAt),
    minutes: asInt(body.minutes),
    note: asText(body.note, 300),
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result);
}
