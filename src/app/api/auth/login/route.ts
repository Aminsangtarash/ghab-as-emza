import { NextRequest, NextResponse } from "next/server";

import { loginAccount, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { ensureLawyerAccounts } from "@/lib/lawyer-accounts";
import { isRateLimited } from "@/lib/rate-limit";
import { ensureStaffAccounts } from "@/lib/staff-accounts";
import { loginSchema } from "@/lib/validations";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  if (isRateLimited(`auth-login:${clientIp(request)}`, 8)) {
    return NextResponse.json(
      { error: "تعداد تلاش‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "داده‌های ارسالی ناقص است.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    await ensureStaffAccounts();
    await ensureLawyerAccounts();
    const result = await loginAccount(parsed.data.phone, parsed.data.password);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, user: result.user });
    response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json(
      { error: "اتصال به پایگاه داده برقرار نشد. MySQL را در XAMPP روشن نگه دارید." },
      { status: 503 },
    );
  }
}
