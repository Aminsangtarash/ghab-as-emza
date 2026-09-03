import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { listUserConversations } from "@/lib/conversations";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "وارد حساب کاربری شوید." }, { status: 401 });
  }
  const items = await listUserConversations(user.id);
  return NextResponse.json({ items });
}
