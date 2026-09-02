import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { getUserConsultation, toClientConsultation } from "@/lib/store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "برای مشاهده درخواست باید وارد حساب کاربری شوید." },
      { status: 401 },
    );
  }

  const { code } = await context.params;
  const stored = await getUserConsultation(user.id, decodeURIComponent(code));
  if (!stored) {
    return NextResponse.json({ error: "درخواست پیدا نشد." }, { status: 404 });
  }

  return NextResponse.json({ item: toClientConsultation(stored) });
}
