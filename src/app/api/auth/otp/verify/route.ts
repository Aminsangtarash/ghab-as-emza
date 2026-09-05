import { NextRequest, NextResponse } from "next/server";

import {
  loginAccountWithOtp,
  registerAccountWithOtp,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { ensureLawyerAccounts } from "@/lib/lawyer-accounts";
import { verifyOtpChallenge } from "@/lib/otp";
import { isRateLimited } from "@/lib/rate-limit";
import { ensureStaffAccounts } from "@/lib/staff-accounts";
import { otpVerifySchema } from "@/lib/validations";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  if (isRateLimited(`auth-otp-verify:${clientIp(request)}`, 12)) {
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

  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "داده‌های ارسالی ناقص است.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { phone, purpose, code, fullName } = parsed.data;

  try {
    const challenge = verifyOtpChallenge({ phone, purpose, code });
    if ("error" in challenge) {
      return NextResponse.json({ error: challenge.error }, { status: 401 });
    }

    await ensureStaffAccounts();
    await ensureLawyerAccounts();

    const result =
      purpose === "register"
        ? await registerAccountWithOtp(fullName ?? challenge.fullName ?? "", phone)
        : await loginAccountWithOtp(phone);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: purpose === "register" ? 409 : 401 },
      );
    }

    const response = NextResponse.json({ ok: true, user: result.user });
    response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(undefined, request));
    return response;
  } catch {
    return NextResponse.json(
      { error: "اتصال به پایگاه داده برقرار نشد. MySQL را در XAMPP روشن نگه دارید." },
      { status: 503 },
    );
  }
}
