import { NextResponse, type NextRequest } from "next/server";

import { createLawyerProposal, listLawyerAssignments, type WorkProposalKind } from "@/lib/desk-workflow";
import { asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

const kinds: WorkProposalKind[] = [
  "result",
  "open-chat",
  "form-case",
  "new-work",
  "close",
  "document-request",
];

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const items = await listLawyerAssignments(guard.lawyer.lawyerSlug);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const body = await readJson(request);
  const kind = asText(body.kind, 40) as WorkProposalKind;
  if (!kinds.includes(kind)) {
    return NextResponse.json({ error: "نوع اقدام نامعتبر است." }, { status: 422 });
  }
  const result = await createLawyerProposal({
    trackingCode: asText(body.trackingCode, 40) ?? "",
    lawyerSlug: guard.lawyer.lawyerSlug,
    kind,
    title: asText(body.title, 180) ?? "",
    body: asText(body.body, 8000) ?? "",
    payload: typeof body.payload === "object" && body.payload ? (body.payload as Record<string, unknown>) : undefined,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result);
}
