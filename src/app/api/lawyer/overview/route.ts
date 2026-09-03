import { NextResponse, type NextRequest } from "next/server";

import { listLawyerAppointments } from "@/lib/appointments";
import { listUpcomingCaseActions } from "@/lib/cases";
import { listLawyerQueueItems } from "@/lib/conversations";
import { getLawyerStats, listConversationsNeedingReply, listLawyerRatings } from "@/lib/lawyer-desk";
import { getLawyerProfile } from "@/lib/lawyer-profile";
import { requireLawyer } from "@/lib/lawyer-guard";

export async function GET(request: NextRequest) {
  const guard = await requireLawyer(request);
  if ("response" in guard) return guard.response;
  const { lawyerSlug } = guard.lawyer;

  const [stats, queue, needsReply, appointments, caseActions, ratings, profile] = await Promise.all([
    getLawyerStats(lawyerSlug),
    listLawyerQueueItems(lawyerSlug),
    listConversationsNeedingReply(lawyerSlug, 6),
    listLawyerAppointments(lawyerSlug, { status: "scheduled", from: new Date(), take: 6 }),
    listUpcomingCaseActions(lawyerSlug, 5),
    listLawyerRatings(lawyerSlug, 4),
    getLawyerProfile(lawyerSlug),
  ]);

  return NextResponse.json({
    stats,
    queue: queue.slice(0, 5),
    needsReply,
    appointments,
    caseActions,
    ratings,
    acceptingNew: profile?.acceptingNew ?? true,
  });
}
