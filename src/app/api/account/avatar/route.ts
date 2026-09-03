import { createReadStream } from "fs";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";

import { deleteUserAvatar, getUserAvatarFile, saveUserAvatar } from "@/lib/account-avatar";
import { getRequestUser } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }

  const file = await getUserAvatarFile(user.id);
  if (!file) {
    return NextResponse.json({ error: "تصویر پروفایل پیدا نشد." }, { status: 404 });
  }

  const stream = Readable.toWeb(createReadStream(file.path)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  if (isRateLimited(`avatar:${user.id}`, 12)) {
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
    return NextResponse.json({ error: "تصویر انتخاب نشده است." }, { status: 400 });
  }

  const result = await saveUserAvatar(user.id, file);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }

  const result = await deleteUserAvatar(user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result);
}
