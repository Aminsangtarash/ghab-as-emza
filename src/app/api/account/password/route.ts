import { NextRequest, NextResponse } from "next/server";

import { getRequestUser, hashPassword } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { updateUserPassword } from "@/lib/store-users";
import { passwordChangeSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  if (isRateLimited(`password:${user.id}`, 8)) {
    return NextResponse.json({ error: "تعداد تلاش بیش از حد است. کمی بعد تلاش کنید." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است." }, { status: 422 });
  }

  const result = await updateUserPassword(
    user.id,
    hashPassword(parsed.data.currentPassword),
    hashPassword(parsed.data.newPassword),
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ ok: true });
}
