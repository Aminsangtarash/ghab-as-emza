import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { postConversationMessage } from "@/lib/conversations";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }
  const text = typeof body === "object" && body && "body" in body ? String((body as { body: unknown }).body) : "";
  const result = await postConversationMessage({
    conversationId: id,
    authorRole: user.role === "lawyer" ? "lawyer" : "user",
    userId: user.id,
    lawyerSlug: user.lawyerSlug,
    body: text,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}
