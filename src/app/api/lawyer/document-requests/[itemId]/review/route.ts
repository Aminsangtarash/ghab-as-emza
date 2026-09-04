import { NextResponse, type NextRequest } from "next/server";

import { reviewDocumentRequestItem } from "@/lib/document-request";
import { asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;

  const { itemId } = await context.params;
  const body = await readJson(request);
  const action = asText(body.action, 20);
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 422 });
  }

  const result = await reviewDocumentRequestItem({
    itemId,
    lawyerSlug: guard.lawyer.lawyerSlug,
    action,
    reason: asText(body.reason, 300),
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}
