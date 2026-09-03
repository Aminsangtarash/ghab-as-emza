import { NextResponse, type NextRequest } from "next/server";

import { listLawyerClients } from "@/lib/lawyer-desk";
import { requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const items = await listLawyerClients(guard.lawyer.lawyerSlug);
  return NextResponse.json({ items });
}
