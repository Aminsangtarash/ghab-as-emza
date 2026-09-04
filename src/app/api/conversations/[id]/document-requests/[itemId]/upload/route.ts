import { NextResponse, type NextRequest } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { uploadDocumentRequestItem } from "@/lib/document-request";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }

  const { id, itemId } = await context.params;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایل ارسال نشده است." }, { status: 422 });
  }

  const result = await uploadDocumentRequestItem({
    conversationId: id,
    itemId,
    userId: user.id,
    file,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}
