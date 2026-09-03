import { NextResponse, type NextRequest } from "next/server";

import { addLawyerNote, deleteLawyerNote, listLawyerNotes } from "@/lib/lawyer-desk";
import { asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const params = request.nextUrl.searchParams;
  const items = await listLawyerNotes(guard.lawyer.lawyerSlug, {
    conversationId: params.get("conversationId") ?? undefined,
    caseId: params.get("caseId") ?? undefined,
  });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const body = await readJson(request);

  const text = asText(body.body, 4000);
  if (!text) return NextResponse.json({ error: "متن یادداشت خالی است." }, { status: 422 });

  const result = await addLawyerNote({
    lawyerSlug: guard.lawyer.lawyerSlug,
    body: text,
    conversationId: asText(body.conversationId, 60),
    caseId: asText(body.caseId, 60),
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "یادداشت مشخص نیست." }, { status: 422 });
  const result = await deleteLawyerNote(guard.lawyer.lawyerSlug, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json(result);
}
