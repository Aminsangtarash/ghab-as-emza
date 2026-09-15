import { NextResponse, type NextRequest } from "next/server";

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

  const { prisma } = await import("@/lib/db");
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, lawyerSlug: guard.lawyer.lawyerSlug },
    select: { consultation: { select: { trackingCode: true } } },
  });
  if (!conversation) {
    return NextResponse.json({ error: "گفتگو پیدا نشد." }, { status: 422 });
  }

  const { createLawyerProposal } = await import("@/lib/desk-workflow");
  const result = await createLawyerProposal({
    trackingCode: conversation.consultation.trackingCode,
    lawyerSlug: guard.lawyer.lawyerSlug,
    kind: "document-request",
    title: asText(body.note, 180) || "درخواست مدرک",
    body: titles.join("\n") || "درخواست ارسال مدرک",
    payload: { titles, note: asText(body.note, 500) },
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({
    ok: true,
    pendingApproval: true,
    message: "درخواست مدرک برای تأیید مدیر ارسال شد.",
  });
}
