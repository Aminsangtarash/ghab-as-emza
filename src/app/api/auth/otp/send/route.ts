import { NextRequest, NextResponse } from "next/server";

import { findUserByPhone } from "@/lib/store-users";
import { createOtpChallenge, clearOtpChallenge, generateOtpCode } from "@/lib/otp";
import { isRateLimited } from "@/lib/rate-limit";
import { sendSmsIrVerifyCode } from "@/lib/sms-ir";
import { otpSendSchema } from "@/lib/validations";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  if (isRateLimited(`auth-otp-send:${clientIp(request)}`, 8)) {
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

  const parsed = otpSendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "داده‌های ارسالی ناقص است.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { phone, purpose, fullName } = parsed.data;

  try {
    if (isRateLimited(`auth-otp-send-phone:${phone}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "برای این شماره تعداد درخواست بیش از حد است. کمی بعد تلاش کنید." },
        { status: 429 },
      );
    }

    const existing = await findUserByPhone(phone);
    if (purpose === "login" && !existing) {
      return NextResponse.json(
        { error: "حسابی با این شماره یافت نشد. ابتدا ثبت نام کنید." },
        { status: 404 },
      );
    }
    if (purpose === "register" && existing) {
      return NextResponse.json({ error: "این شماره قبلاً ثبت شده است." }, { status: 409 });
    }
    if (existing?.active === false) {
      return NextResponse.json({ error: "حساب شما غیرفعال شده است." }, { status: 403 });
    }

    const code = generateOtpCode();
    const challenge = createOtpChallenge({
      phone,
      purpose,
      code,
      fullName: purpose === "register" ? fullName : undefined,
    });
    if ("error" in challenge) {
      return NextResponse.json(
        { error: challenge.error, retryAfterSec: challenge.retryAfterSec },
        { status: 429 },
      );
    }

    const sent = await sendSmsIrVerifyCode(phone, code);
    if (!sent.ok) {
      clearOtpChallenge(phone, purpose);
      return NextResponse.json({ error: sent.error }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      expiresInSec: challenge.expiresInSec,
      retryAfterSec: 60,
    });
  } catch {
    return NextResponse.json(
      { error: "اتصال به پایگاه داده برقرار نشد. MySQL را در XAMPP روشن نگه دارید." },
      { status: 503 },
    );
  }
}
