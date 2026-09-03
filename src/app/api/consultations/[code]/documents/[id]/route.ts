import { createReadStream } from "fs";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { getReadableDocument } from "@/lib/consult-documents";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string; id: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  const { code, id } = await context.params;
  const file = await getReadableDocument({
    documentId: id,
    trackingCode: decodeURIComponent(code),
    userId: user.id,
    role: user.role,
    lawyerSlug: user.lawyerSlug,
  });
  if (!file) {
    return NextResponse.json({ error: "فایل پیدا نشد." }, { status: 404 });
  }

  const stream = Readable.toWeb(createReadStream(file.path)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
