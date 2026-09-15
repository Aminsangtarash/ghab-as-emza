import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import {
  acceptConsultation,
  closeConversation,
  getConversationForLawyer,
  listLawyerConversations,
  listLawyerQueue,
  markPhoneCallDone,
  postConversationMessage,
  rejectOrCancelConsultation,
  reopenConversation,
} from "@/lib/conversations";
import { addLawyerNote, listLawyerNotes } from "@/lib/lawyer-desk";
import { ensureLawyerAccounts } from "@/lib/lawyer-accounts";
import { serviceTitle } from "@/lib/consult";

async function lawyerUser(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || user.role !== "lawyer" || !user.lawyerSlug) return null;
  return user;
}

export async function GET(request: NextRequest) {
  await ensureLawyerAccounts();
  const user = await lawyerUser(request);
  if (!user?.lawyerSlug) {
    return NextResponse.json({ error: "فقط وکیل می‌تواند این بخش را ببیند." }, { status: 403 });
  }
  const [queue, conversations] = await Promise.all([
    listLawyerQueue(user.lawyerSlug),
    listLawyerConversations(user.lawyerSlug),
  ]);
  return NextResponse.json({
    queue: queue.map((item) => ({
      trackingCode: item.trackingCode,
      subject: item.subject,
      channel: item.channel,
      status: item.status,
      serviceTitle: serviceTitle(item.service),
      createdAt: item.createdAt.toISOString(),
    })),
    conversations,
  });
}

export async function POST(request: NextRequest) {
  await ensureLawyerAccounts();
  const user = await lawyerUser(request);
  if (!user?.lawyerSlug) {
    return NextResponse.json({ error: "فقط وکیل می‌تواند این بخش را ببیند." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }

  const action = String(body.action ?? "");
  const trackingCode = typeof body.trackingCode === "string" ? body.trackingCode : "";
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";

  if (action === "accept" || action === "reject") {
    return NextResponse.json(
      { error: "پذیرش یا رد توسط وکیل مجاز نیست. تخصیص فقط با مدیر سیستم است." },
      { status: 403 },
    );
  }
  if (action === "phone-done") {
    const result = await markPhoneCallDone(user.lawyerSlug, conversationId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }
  if (action === "close") {
    const conversation = await (await import("@/lib/db")).prisma.conversation.findFirst({
      where: { id: conversationId, lawyerSlug: user.lawyerSlug },
      select: { consultation: { select: { trackingCode: true } } },
    });
    if (!conversation) return NextResponse.json({ error: "گفتگو پیدا نشد." }, { status: 422 });
    const { createLawyerProposal } = await import("@/lib/desk-workflow");
    const result = await createLawyerProposal({
      trackingCode: conversation.consultation.trackingCode,
      lawyerSlug: user.lawyerSlug,
      kind: "close",
      title: "پیشنهاد پایان کار",
      body: typeof body.summary === "string" && body.summary.trim() ? body.summary : "درخواست بستن پرونده",
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json({
      ok: true,
      pendingApproval: true,
      message: "پایان کار برای تأیید مدیر ارسال شد.",
    });
  }
  if (action === "reopen") {
    const result = await reopenConversation(user.lawyerSlug, conversationId);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }
  if (action === "note") {
    const result = await addLawyerNote({
      lawyerSlug: user.lawyerSlug,
      conversationId,
      body: String(body.body ?? ""),
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }
  if (action === "notes") {
    const items = await listLawyerNotes(user.lawyerSlug, { conversationId });
    return NextResponse.json({ items });
  }
  if (action === "message") {
    const result = await postConversationMessage({
      conversationId,
      authorRole: "lawyer",
      userId: user.id,
      lawyerSlug: user.lawyerSlug,
      body: String(body.body ?? ""),
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result);
  }
  if (action === "get") {
    const item = await getConversationForLawyer(user.lawyerSlug, conversationId);
    if (!item) return NextResponse.json({ error: "گفتگو پیدا نشد." }, { status: 404 });
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 422 });
}
