import { NextRequest, NextResponse } from "next/server";

import { isRateLimited } from "@/lib/rate-limit";
import { saveConsultation } from "@/lib/store";
import { consultationSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(`consult:${ip}`)) {
    return NextResponse.json(
      { error: "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = consultationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "داده‌های ارسالی ناقص است.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const saved = saveConsultation(parsed.data);
  return NextResponse.json({
    ok: true,
    trackingCode: saved.trackingCode,
  });
}
