import { NextResponse, type NextRequest } from "next/server";

import { getLawyerProfile, updateLawyerProfile } from "@/lib/lawyer-profile";
import { asBool, asText, readJson, requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const item = await getLawyerProfile(guard.lawyer.lawyerSlug);
  if (!item) return NextResponse.json({ error: "پروفایل پیدا نشد." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const body = await readJson(request);

  const result = await updateLawyerProfile(guard.lawyer.lawyerSlug, {
    headline: asText(body.headline, 160),
    bio: asText(body.bio, 1500),
    officeHours: asText(body.officeHours, 160),
    officePhone: asText(body.officePhone, 40),
    city: asText(body.city, 60),
    acceptingNew: asBool(body.acceptingNew),
    autoAccept: asBool(body.autoAccept),
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });

  const item = await getLawyerProfile(guard.lawyer.lawyerSlug);
  return NextResponse.json({ ok: true, item });
}
