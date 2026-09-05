import "server-only";

import type { ChatAudience, ChatStreamEvent } from "@/lib/chat-event-types";
import type { ClientMessage } from "@/lib/conversations";

export type { ChatAudience, ChatStreamEvent } from "@/lib/chat-event-types";

type Subscriber = {
  id: string;
  userId?: string;
  lawyerSlug?: string;
  send: (event: ChatStreamEvent) => void;
};

const subscribers = new Map<string, Subscriber>();

export function subscribeChatEvents(input: {
  userId?: string;
  lawyerSlug?: string;
  send: (event: ChatStreamEvent) => void;
}) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  subscribers.set(id, { id, ...input });
  return () => {
    subscribers.delete(id);
  };
}

function publishToMatching(event: ChatStreamEvent, match: (sub: Subscriber) => boolean) {
  for (const sub of subscribers.values()) {
    if (!match(sub)) continue;
    try {
      sub.send(event);
    } catch {
      subscribers.delete(sub.id);
    }
  }
}

export function publishChatMessage(input: {
  conversationId: string;
  subject: string;
  message: ClientMessage;
  userId: string;
  lawyerSlug: string;
}) {
  const preview = input.message.body.trim().slice(0, 120);
  const base = {
    type: "message" as const,
    conversationId: input.conversationId,
    subject: input.subject,
    preview,
    message: input.message,
  };

  if (input.message.authorRole === "user") {
    publishToMatching({ ...base, forAudience: "lawyer" }, (sub) => sub.lawyerSlug === input.lawyerSlug);
  } else if (input.message.authorRole === "lawyer") {
    publishToMatching({ ...base, forAudience: "user" }, (sub) => sub.userId === input.userId);
  } else {
    publishToMatching({ ...base, forAudience: "user" }, (sub) => sub.userId === input.userId);
    publishToMatching({ ...base, forAudience: "lawyer" }, (sub) => sub.lawyerSlug === input.lawyerSlug);
  }
}

export function publishUnreadTotal(input: {
  total: number;
  userId?: string;
  lawyerSlug?: string;
  audience: ChatAudience;
}) {
  publishToMatching(
    { type: "unread", total: input.total, forAudience: input.audience },
    (sub) =>
      (input.audience === "user" && Boolean(input.userId) && sub.userId === input.userId) ||
      (input.audience === "lawyer" && Boolean(input.lawyerSlug) && sub.lawyerSlug === input.lawyerSlug),
  );
}

export function chatSubscriberCount() {
  return subscribers.size;
}
