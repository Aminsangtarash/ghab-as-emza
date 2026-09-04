import { NextRequest, NextResponse } from "next/server";

import { createCooperationApplication } from "@/lib/cooperation";
import { isRateLimited } from "@/lib/rate-limit";
import { cooperationSchema } from "@/lib/validations";

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

  const parsed = cooperationSchema.safeParse(body);
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
    const result = await createCooperationApplication(parsed.data);
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
