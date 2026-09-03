import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConversationThread } from "@/components/account/conversation-thread";
import { LawyerThreadTools } from "@/components/lawyer/lawyer-thread-tools";
import { getServerUser } from "@/lib/auth";
import { getConversationForLawyer } from "@/lib/conversations";

export const metadata: Metadata = {
  title: "گفتگوی وکیل",
};

export default async function LawyerChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user?.lawyerSlug) notFound();
  const { id } = await params;
  const item = await getConversationForLawyer(user.lawyerSlug, id);
  if (!item) notFound();

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="min-w-0">
        <ConversationThread conversationId={id} viewer="lawyer" />
      </div>
      <aside className="min-w-0">
        <LawyerThreadTools conversationId={id} />
      </aside>
    </div>
  );
}
