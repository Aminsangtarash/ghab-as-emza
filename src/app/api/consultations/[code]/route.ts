import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { deleteCancelledConsultation, getUserConsultation, toClientConsultation } from "@/lib/store";

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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  if (isRateLimited(`consult-delete:${user.id}`, 12)) {
    return NextResponse.json({ error: "تعداد حذف بیش از حد است. کمی بعد تلاش کنید." }, { status: 429 });
  }

  const { code } = await context.params;
  const result = await deleteCancelledConsultation(user.id, decodeURIComponent(code));
  if ("error" in result) {
    const status = result.error === "درخواست پیدا نشد." ? 404 : 422;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
