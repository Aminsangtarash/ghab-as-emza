import { NextResponse, type NextRequest } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { listUserCases } from "@/lib/cases";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "برای مشاهده پرونده‌ها باید وارد حساب کاربری شوید." },
      { status: 401 },
    );
  }
  const items = await listUserCases(user.id);
  return NextResponse.json({ items });
}
