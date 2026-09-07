import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountChatWorkspace } from "@/components/account/account-chat-workspace";
import { refreshAdminCaches } from "@/lib/admin-ops";
import { getServerUser } from "@/lib/auth";
import { resolveLawyer } from "@/lib/catalog-cache";
import { getConversationForUser } from "@/lib/conversations";

export const metadata: Metadata = {
  title: "گفتگو",
};

export default async function AccountChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user) notFound();
  const { id } = await params;
  const item = await getConversationForUser(user.id, id);
  if (!item) notFound();

  await refreshAdminCaches();
  const lawyer = resolveLawyer(item.summary.lawyerSlug) ?? null;

  return <AccountChatWorkspace conversationId={id} summary={item.summary} lawyer={lawyer} />;
}
