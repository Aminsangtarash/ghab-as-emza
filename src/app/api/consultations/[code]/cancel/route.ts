import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { rejectOrCancelConsultation } from "@/lib/conversations";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  const { code } = await context.params;
  let reason: string | undefined;
  try {
    const body = (await request.json()) as { reason?: string };
    reason = body.reason;
  } catch {
    reason = undefined;
  }
  const result = await rejectOrCancelConsultation({
    trackingCode: decodeURIComponent(code),
    actor: "user",
    userId: user.id,
    reason,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}
