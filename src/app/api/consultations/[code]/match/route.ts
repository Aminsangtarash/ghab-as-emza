import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { getUrgentMatchStatus } from "@/lib/conversations";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  const { code } = await context.params;
  const result = await getUrgentMatchStatus(user.id, decodeURIComponent(code));
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result);
}
