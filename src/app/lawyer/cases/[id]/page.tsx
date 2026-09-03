import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LawyerCaseDetail } from "@/components/lawyer/lawyer-case-detail";
import { getServerUser } from "@/lib/auth";
import { getLawyerCase } from "@/lib/cases";

export const metadata: Metadata = {
  title: "جزئیات پرونده",
};

export default async function LawyerCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user?.lawyerSlug) notFound();
  const { id } = await params;
  const item = await getLawyerCase(user.lawyerSlug, id);
  if (!item) notFound();

  return <LawyerCaseDetail caseId={id} />;
}
