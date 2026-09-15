import { NextResponse, type NextRequest } from "next/server";

import { asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const items = await (await import("@/lib/desk-workflow")).listLawyerAssignments(guard.lawyer.lawyerSlug);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;

  const body = await readJson(request);
  const action = asText(body.action, 20);
  const trackingCode = asText(body.trackingCode, 40);
  if (!trackingCode) {
    return NextResponse.json({ error: "کد درخواست مشخص نیست." }, { status: 422 });
  }

  if (action === "accept" || action === "reject") {
    return NextResponse.json(
      { error: "پذیرش یا رد توسط وکیل مجاز نیست. تخصیص فقط با مدیر سیستم است." },
      { status: 403 },
    );
  }

  return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 422 });
}
