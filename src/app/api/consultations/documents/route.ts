import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { listPendingDocuments, savePendingDocument } from "@/lib/consult-documents";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  return NextResponse.json({ items: await listPendingDocuments(user.id) });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  if (isRateLimited(`docs:${user.id}`, 20)) {
    return NextResponse.json({ error: "تعداد بارگذاری بیش از حد است. کمی بعد تلاش کنید." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "فایل دریافت نشد." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایل انتخاب نشده است." }, { status: 400 });
  }

  const result = await savePendingDocument(user.id, file);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}
