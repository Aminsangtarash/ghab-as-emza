import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { createCooperationApplication } from "@/lib/cooperation";
import { verifyOtpChallenge } from "@/lib/otp";
import { isRateLimited } from "@/lib/rate-limit";
import { cooperationSchema, cooperationSubmitSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(`cooperate:${ip}`, 6)) {
    return NextResponse.json(
      { error: "تعداد درخواست‌ها بیش از حد مجاز است." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }

  try {
    const sessionUser = await getRequestUser(request);
    const draft = cooperationSchema.safeParse(body);
    if (!draft.success) {
      return NextResponse.json(
        {
          error: draft.error.issues[0]?.message ?? "داده‌های ارسالی ناقص است.",
          fields: draft.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const application = draft.data;
    const phoneAlreadyVerified =
      Boolean(sessionUser) &&
      sessionUser!.active !== false &&
      sessionUser!.phone === application.phone;

    if (!phoneAlreadyVerified) {
      const withOtp = cooperationSubmitSchema.safeParse(body);
      if (!withOtp.success) {
        return NextResponse.json(
          {
            error: withOtp.error.issues[0]?.message ?? "کد تأیید موبایل الزامی است.",
            fields: withOtp.error.flatten().fieldErrors,
          },
          { status: 422 },
        );
      }

      const challenge = verifyOtpChallenge({
        phone: application.phone,
        purpose: "cooperate",
        code: withOtp.data.otpCode,
      });
      if ("error" in challenge) {
        return NextResponse.json({ error: challenge.error }, { status: 401 });
      }
    }

    const result = await createCooperationApplication(application);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ ok: true, id: result.id });
  } catch {
    return NextResponse.json(
      { error: "ثبت درخواست ممکن نشد. کمی بعد دوباره تلاش کنید." },
      { status: 503 },
    );
  }
}
