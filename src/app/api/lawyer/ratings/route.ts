import { NextResponse, type NextRequest } from "next/server";

import { getLawyerStats, listLawyerRatings } from "@/lib/lawyer-desk";
import { requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const [items, stats] = await Promise.all([
    listLawyerRatings(guard.lawyer.lawyerSlug),
    getLawyerStats(guard.lawyer.lawyerSlug),
  ]);
  return NextResponse.json({ items, summary: stats.ratings });
}
