import { NextResponse, type NextRequest } from "next/server";

import { acceptConsultation, listLawyerQueueItems, rejectOrCancelConsultation } from "@/lib/conversations";
import { asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const items = await listLawyerQueueItems(guard.lawyer.lawyerSlug);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const { lawyerSlug } = guard.lawyer;

  const body = await readJson(request);
  const action = asText(body.action, 20);
  const trackingCode = asText(body.trackingCode, 40);
  if (!trackingCode) {
    return NextResponse.json({ error: "کد درخواست مشخص نیست." }, { status: 422 });
  }

  if (action === "accept") {
    const result = await acceptConsultation(lawyerSlug, trackingCode, asText(body.firstMessage, 4000));
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  if (action === "reject") {
    const result = await rejectOrCancelConsultation({
      trackingCode,
      actor: "lawyer",
      lawyerSlug,
      reason: asText(body.reason, 300),
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 422 });
}
