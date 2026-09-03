import { NextResponse, type NextRequest } from "next/server";

import { parseCaseEventKind } from "@/lib/case-model";
import { addCaseEvent } from "@/lib/cases";
import { asBool, asDate, asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const { id } = await context.params;
  const body = await readJson(request);

  const kind = parseCaseEventKind(body.kind);
  const title = asText(body.title, 160);
  if (!kind) return NextResponse.json({ error: "نوع رویداد نامعتبر است." }, { status: 422 });
  if (!title) return NextResponse.json({ error: "عنوان رویداد لازم است." }, { status: 422 });

  const result = await addCaseEvent({
    lawyerSlug: guard.lawyer.lawyerSlug,
    caseId: id,
    kind,
    title,
    body: asText(body.body, 4000),
    happensAt: asDate(body.happensAt),
    visibleToClient: asBool(body.visibleToClient) ?? true,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result);
}
