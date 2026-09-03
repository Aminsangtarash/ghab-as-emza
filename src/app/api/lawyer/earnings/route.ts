import { NextResponse, type NextRequest } from "next/server";

import { countLawyerCases } from "@/lib/cases";
import { getLawyerEarnings } from "@/lib/lawyer-desk";
import { requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const [earnings, cases] = await Promise.all([
    getLawyerEarnings(guard.lawyer.lawyerSlug),
    countLawyerCases(guard.lawyer.lawyerSlug),
  ]);
  return NextResponse.json({
    ...earnings,
    caseFeeTotal: cases.feeTotal,
    caseFeePaid: cases.paidTotal,
  });
}
