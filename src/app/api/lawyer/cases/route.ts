import { NextResponse, type NextRequest } from "next/server";

import { parseCaseStage, parseCaseStatus } from "@/lib/case-model";
import { createCase, listLawyerCases } from "@/lib/cases";
import { asDate, asInt, asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const status = parseCaseStatus(request.nextUrl.searchParams.get("status") ?? undefined);
  const items = await listLawyerCases(guard.lawyer.lawyerSlug, status);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;

  const body = await readJson(request);
  const stage = parseCaseStage(body.stage);
  if (!stage) return NextResponse.json({ error: "مرحله پرونده را انتخاب کنید." }, { status: 422 });

  const title = asText(body.title, 160);
  const summary = asText(body.summary, 4000);
  if (!title || !summary) {
    return NextResponse.json({ error: "عنوان و شرح پرونده لازم است." }, { status: 422 });
  }

  const result = await createCase({
    lawyerSlug: guard.lawyer.lawyerSlug,
    conversationId: asText(body.conversationId, 60),
    userId: asText(body.userId, 60),
    title,
    summary,
    stage,
    authority: asText(body.authority, 120),
    courtBranch: asText(body.courtBranch, 120),
    fileNumber: asText(body.fileNumber, 60),
    feeToman: asInt(body.feeToman) ?? 0,
    nextActionAt: asDate(body.nextActionAt),
    nextActionNote: asText(body.nextActionNote, 300),
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result);
}
