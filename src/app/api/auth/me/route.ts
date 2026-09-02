import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  return NextResponse.json({ user: await getRequestUser(request) });
}
