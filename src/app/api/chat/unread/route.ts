import { NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth";
import { getUnreadSnapshot } from "@/lib/chat-unread";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });
  }

  if (user.role === "lawyer") {
    if (!user.lawyerSlug) {
      return NextResponse.json({ error: "پروفایل وکیل ناقص است." }, { status: 403 });
    }
    const snapshot = await getUnreadSnapshot({ audience: "lawyer", lawyerSlug: user.lawyerSlug });
    return NextResponse.json({ ok: true, ...snapshot });
  }

  const snapshot = await getUnreadSnapshot({ audience: "user", userId: user.id });
  return NextResponse.json({ ok: true, ...snapshot });
}
