import { ConversationCasePanel } from "@/components/account/conversation-case-panel";
import { ConversationThread } from "@/components/account/conversation-thread";
import type { ClientConversation } from "@/lib/conversations";

export function AccountChatWorkspace({
  conversationId,
  summary,
}: {
  conversationId: string;
  summary: ClientConversation;
}) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <ConversationThread conversationId={conversationId} viewer="user" hideDocuments />
      </div>
      <div className="min-w-0 lg:sticky lg:top-4">
        <ConversationCasePanel summary={summary} />
      </div>
    </div>
  );
}
