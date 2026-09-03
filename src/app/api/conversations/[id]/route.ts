import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { getConversationForUser } from "@/lib/conversations";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  const { id } = await context.params;
  const item = await getConversationForUser(user.id, id);
  if (!item) {
    return NextResponse.json({ error: "گفتگو پیدا نشد." }, { status: 404 });
  }
  return NextResponse.json(item);
}
