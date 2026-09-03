import { NextResponse, type NextRequest } from "next/server";

import { parseCaseStage, parseCaseStatus } from "@/lib/case-model";
import { getLawyerCase, updateCase } from "@/lib/cases";
import { listLawyerNotes } from "@/lib/lawyer-desk";
import { asDate, asInt, asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const { id } = await context.params;

  const [item, notes] = await Promise.all([
    getLawyerCase(guard.lawyer.lawyerSlug, id),
    listLawyerNotes(guard.lawyer.lawyerSlug, { caseId: id }),
  ]);
  if (!item) return NextResponse.json({ error: "پرونده پیدا نشد." }, { status: 404 });
  return NextResponse.json({ item, notes });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const { id } = await context.params;
  const body = await readJson(request);

  const nextActionAt =
    body.nextActionAt === null ? null : asDate(body.nextActionAt) ?? undefined;

  const result = await updateCase(guard.lawyer.lawyerSlug, id, {
    status: parseCaseStatus(body.status),
    stage: parseCaseStage(body.stage),
    authority: asText(body.authority, 120),
    courtBranch: asText(body.courtBranch, 120),
    fileNumber: asText(body.fileNumber, 60),
    feeToman: asInt(body.feeToman),
    paidToman: asInt(body.paidToman),
    nextActionAt,
    nextActionNote: asText(body.nextActionNote, 300),
    closeNote: asText(body.closeNote, 4000),
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result);
}
