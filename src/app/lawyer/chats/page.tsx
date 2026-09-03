import type { Metadata } from "next";

import { LawyerChats } from "@/components/lawyer/lawyer-chats";

export const metadata: Metadata = {
  title: "گفتگوهای وکیل",
};

export default async function LawyerChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  return <LawyerChats initialFilter={filter} />;
}
