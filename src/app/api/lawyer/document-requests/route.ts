import { NextResponse, type NextRequest } from "next/server";

import { createDocumentRequest } from "@/lib/document-request";
import { asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function POST(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;

  const body = await readJson(request);
  const conversationId = asText(body.conversationId, 60);
  if (!conversationId) {
    return NextResponse.json({ error: "شناسه گفتگو لازم است." }, { status: 422 });
  }

  const titles = Array.isArray(body.titles)
    ? body.titles.filter((item): item is string => typeof item === "string")
    : [];

  const result = await createDocumentRequest({
    conversationId,
    lawyerSlug: guard.lawyer.lawyerSlug,
    titles,
    note: asText(body.note, 500),
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}
