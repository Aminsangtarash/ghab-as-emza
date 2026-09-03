import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { rateConversation } from "@/lib/conversations";

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
  const score =
    typeof body === "object" && body && "score" in body ? Number((body as { score: unknown }).score) : 0;
  const comment =
    typeof body === "object" && body && "comment" in body
      ? String((body as { comment: unknown }).comment ?? "")
      : undefined;
  const result = await rateConversation(user.id, id, score, comment);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}
