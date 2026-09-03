import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { listUserConsultations, saveConsultation, toClientConsultation } from "@/lib/store";
import { consultationSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "برای مشاهده درخواست‌ها باید وارد حساب کاربری شوید." },
      { status: 401 },
    );
  }

  const items = await listUserConsultations(user.id);
  return NextResponse.json({
    items: items.map(toClientConsultation),
  });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "برای ثبت درخواست باید وارد حساب کاربری شوید." },
      { status: 401 },
    );
  }

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

  const documentIds = Array.isArray((body as { documentIds?: unknown }).documentIds)
    ? ((body as { documentIds: unknown[] }).documentIds.filter(
        (item): item is string => typeof item === "string" && /^[0-9a-f-]{36}$/i.test(item),
      ) as string[])
    : [];

  try {
    const saved = await saveConsultation(parsed.data, user.id, documentIds);
    if ("error" in saved) {
      return NextResponse.json({ error: saved.error }, { status: 422 });
    }
    return NextResponse.json({
      ok: true,
      trackingCode: saved.trackingCode,
      id: saved.id,
    });
  } catch {
    return NextResponse.json(
      { error: "ثبت درخواست با خطا روبه‌رو شد. کمی بعد دوباره تلاش کنید." },
      { status: 500 },
    );
  }
}
