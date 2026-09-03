import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { setVideoSession } from "@/lib/conversations";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }
  const action =
    typeof body === "object" && body && "action" in body ? String((body as { action: unknown }).action) : "";
  if (action !== "start" && action !== "end") {
    return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 422 });
  }
  const result = await setVideoSession(id, action, {
    userId: user.id,
    lawyerSlug: user.lawyerSlug,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}
