import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccountChatWorkspace } from "@/components/account/account-chat-workspace";
import { getServerUser } from "@/lib/auth";
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

  return <AccountChatWorkspace conversationId={id} summary={item.summary} />;
}
