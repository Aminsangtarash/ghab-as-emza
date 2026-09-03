import { NextResponse, type NextRequest } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { getUserCase, respondToCase } from "@/lib/cases";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  const { id } = await context.params;
  const item = await getUserCase(user.id, id);
  if (!item) return NextResponse.json({ error: "پرونده پیدا نشد." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  const { id } = await context.params;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const action = body.action === "accept" ? "accept" : body.action === "decline" ? "decline" : null;
  if (!action) return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 422 });

  const result = await respondToCase(
    user.id,
    id,
    action,
    typeof body.note === "string" ? body.note : undefined,
  );
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result);
}
