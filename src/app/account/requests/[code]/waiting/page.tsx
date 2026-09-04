import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UrgentWaitingRoom } from "@/components/account/urgent-waiting-room";
import { getServerUser } from "@/lib/auth";
import { isUrgentConsultService } from "@/lib/consult";
import { getUserConsultation } from "@/lib/store";

export const metadata: Metadata = {
  title: "یافتن وکیل",
};

export default async function UrgentWaitingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const user = await getServerUser();
  if (!user) notFound();
  const { code } = await params;
  const item = await getUserConsultation(user.id, decodeURIComponent(code));
  if (!item || !isUrgentConsultService(item.service)) notFound();

  return (
    <div className="pt-2">
      <UrgentWaitingRoom trackingCode={item.trackingCode} />
    </div>
  );
}
