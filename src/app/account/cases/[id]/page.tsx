import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountCaseDetail } from "@/components/account/account-case-detail";
import { getServerUser } from "@/lib/auth";
import { getUserCase } from "@/lib/cases";

export const metadata: Metadata = {
  title: "جزئیات پرونده",
};

export default async function AccountCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user) notFound();
  const { id } = await params;
  const item = await getUserCase(user.id, id);
  if (!item) notFound();

  return <AccountCaseDetail caseId={id} />;
}
