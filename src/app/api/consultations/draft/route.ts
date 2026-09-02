import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { clearConsultDraft, getConsultDraft, saveConsultDraft } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  return NextResponse.json({ draft: await getConsultDraft(user.id) });
}

export async function PUT(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ساختار درخواست نامعتبر است." }, { status: 400 });
  }

  const saved = await saveConsultDraft(user.id, body);
  return NextResponse.json({ ok: true, draft: saved });
}

export async function DELETE(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  await clearConsultDraft(user.id);
  return NextResponse.json({ ok: true });
}
