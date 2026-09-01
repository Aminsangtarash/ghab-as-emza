import { NextRequest, NextResponse } from "next/server";

import { isRateLimited } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(`contact:${ip}`)) {
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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "داده‌های ارسالی ناقص است.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true });
}
