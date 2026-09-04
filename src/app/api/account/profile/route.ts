import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { updateUserProfile } from "@/lib/store-users";
import { profileUpdateSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  if (isRateLimited(`profile:${user.id}`, 20)) {
    return NextResponse.json({ error: "تعداد ویرایش بیش از حد است. کمی بعد تلاش کنید." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است." }, { status: 422 });
  }

  const updated = await updateUserProfile(user.id, parsed.data);
  return NextResponse.json({ user: updated });
}
