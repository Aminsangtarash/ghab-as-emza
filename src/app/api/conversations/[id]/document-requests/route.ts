import { NextResponse, type NextRequest } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { listConversationDocumentRequests } from "@/lib/document-request";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }

  const { id } = await context.params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { userId: true, lawyerSlug: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "گفتگو پیدا نشد." }, { status: 404 });
  }

  const allowed =
    conversation.userId === user.id ||
    (user.role === "lawyer" && user.lawyerSlug === conversation.lawyerSlug);
  if (!allowed) {
    return NextResponse.json({ error: "اجازه مشاهده ندارید." }, { status: 403 });
  }

  const items = await listConversationDocumentRequests(id);
  return NextResponse.json({ items });
}
