import { NextResponse, type NextRequest } from "next/server";

import { listLawyerConversations } from "@/lib/conversations";
import { requireLawyer } from "@/lib/lawyer-guard";

const filters = ["all", "open", "closed", "needs-reply"] as const;
type Filter = (typeof filters)[number];

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const raw = request.nextUrl.searchParams.get("filter") ?? "all";
  const filter = (filters.includes(raw as Filter) ? raw : "all") as Filter;
  const items = await listLawyerConversations(guard.lawyer.lawyerSlug, filter);
  return NextResponse.json({ items });
}
