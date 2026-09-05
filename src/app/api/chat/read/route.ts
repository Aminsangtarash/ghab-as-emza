import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerUser } from "@/lib/auth";
import { markConversationRead } from "@/lib/chat-unread";

const bodySchema = z.object({
  conversationId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "شناسه گفتگو نامعتبر است." }, { status: 422 });
  }

  if (user.role === "lawyer") {
    if (!user.lawyerSlug) {
      return NextResponse.json({ error: "پروفایل وکیل ناقص است." }, { status: 403 });
    }
    const result = await markConversationRead({
      conversationId: parsed.data.conversationId,
      audience: "lawyer",
      lawyerSlug: user.lawyerSlug,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    return NextResponse.json(result);
  }

  const result = await markConversationRead({
    conversationId: parsed.data.conversationId,
    audience: "user",
    userId: user.id,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json(result);
}
