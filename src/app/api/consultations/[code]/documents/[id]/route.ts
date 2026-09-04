import { createReadStream } from "fs";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import {
  deleteConsultationDocumentForLawyer,
  getReadableDocument,
} from "@/lib/consult-documents";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string; id: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  const { code, id } = await context.params;
  const inline = request.nextUrl.searchParams.get("inline") === "1";
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
      "Content-Disposition": inline
        ? `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`
        : `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ code: string; id: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  if (user.role !== "lawyer" || !user.lawyerSlug) {
    return NextResponse.json({ error: "فقط وکیل مسئول می‌تواند فایل را حذف کند." }, { status: 403 });
  }

  const { code, id } = await context.params;
  const result = await deleteConsultationDocumentForLawyer({
    documentId: id,
    trackingCode: decodeURIComponent(code),
    lawyerSlug: user.lawyerSlug,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ ok: true });
}
