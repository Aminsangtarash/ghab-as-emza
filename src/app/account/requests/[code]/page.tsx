import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RequestDetail } from "@/components/account/request-detail";
import { getServerUser } from "@/lib/auth";
import { getUserConsultation, toClientConsultation } from "@/lib/store";

export const metadata: Metadata = {
  title: "جزئیات درخواست",
};

export default async function AccountRequestDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const user = await getServerUser();
  if (!user) notFound();

  const { code } = await params;
  const stored = await getUserConsultation(user.id, decodeURIComponent(code));
  if (!stored) notFound();

  return <RequestDetail item={toClientConsultation(stored)} />;
}
