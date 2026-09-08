import { NextRequest, NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth";
import { reselectConsultationLawyer } from "@/lib/consultation-lifecycle";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });

  const { code } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const mode = body.mode === "assign" ? "assign" : "chosen";
  const result = await reselectConsultationLawyer({
    trackingCode: code,
    userId: user.id,
    mode,
    lawyerSlug: typeof body.lawyerSlug === "string" ? body.lawyerSlug : undefined,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json(result);
}
