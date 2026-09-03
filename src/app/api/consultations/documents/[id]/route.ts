import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { deletePendingDocument } from "@/lib/consult-documents";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  const { id } = await context.params;
  const result = await deletePendingDocument(user.id, id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result);
}
