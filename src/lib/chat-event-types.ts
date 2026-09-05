export type ChatAudience = "user" | "lawyer";

export type ChatEventMessage = {
  id: string;
  authorRole: "user" | "lawyer" | "system";
  body: string;
  createdAt: string;
};

export type ChatStreamEvent =
  | {
      type: "message";
      conversationId: string;
      subject: string;
      preview: string;
      message: ChatEventMessage;
      forAudience: ChatAudience;
    }
  | {
      type: "unread";
      total: number;
      forAudience: ChatAudience;
    }
  | {
      type: "ping";
    };
