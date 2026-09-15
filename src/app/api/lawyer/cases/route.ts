import { NextResponse, type NextRequest } from "next/server";

import { parseCaseStage, parseCaseStatus } from "@/lib/case-model";
import { listLawyerCases } from "@/lib/cases";
import { asInt, asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

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

  let tracking = asText(body.trackingCode, 40);
  const conversationId = asText(body.conversationId, 60);
  if (!tracking && conversationId) {
    const { prisma } = await import("@/lib/db");
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, lawyerSlug: guard.lawyer.lawyerSlug },
      select: { consultation: { select: { trackingCode: true } } },
    });
    tracking = conversation?.consultation.trackingCode ?? "";
  }
  if (!tracking) {
    return NextResponse.json(
      { error: "تشکیل پرونده باید از مسیر تأیید مدیر انجام شود." },
      { status: 422 },
    );
  }

  const { createLawyerProposal } = await import("@/lib/desk-workflow");
    const proposed = await createLawyerProposal({
      trackingCode: tracking,
      lawyerSlug: guard.lawyer.lawyerSlug,
      kind: "form-case",
      title,
      body: summary,
      payload: {
        title,
        summary,
        stage,
        authority: asText(body.authority, 120),
        courtBranch: asText(body.courtBranch, 120),
        fileNumber: asText(body.fileNumber, 60),
        feeToman: asInt(body.feeToman) ?? 0,
        nextActionNote: asText(body.nextActionNote, 300),
      },
    });
    if ("error" in proposed) return NextResponse.json({ error: proposed.error }, { status: 422 });
    return NextResponse.json({
      ok: true,
      pendingApproval: true,
      message: "تشکیل پرونده برای تأیید مدیر ارسال شد.",
    });
}
