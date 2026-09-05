"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import type { ChatStreamEvent } from "@/lib/chat-event-types";

type ChatNotificationsContextValue = {
  unreadTotal: number;
  byConversation: Record<string, number>;
  setActiveConversationId: (id: string | null) => void;
  refreshUnread: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission | "unsupported">;
};

const ChatNotificationsContext = createContext<ChatNotificationsContextValue | null>(null);

function chatsBasePath(pathname: string) {
  if (pathname.startsWith("/lawyer")) return "/lawyer/chats";
  return "/account/chats";
}

function showBrowserNotification(input: {
  title: string;
  body: string;
  conversationId: string;
  basePath: string;
  onClick: () => void;
}) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(input.title, {
      body: input.body,
      tag: `chat-${input.conversationId}`,
      dir: "rtl",
      lang: "fa",
    });
    notification.onclick = () => {
      window.focus();
      input.onClick();
      notification.close();
    };
  } catch {
    /* Safari / restricted contexts */
  }
}

export function ChatNotificationsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [byConversation, setByConversation] = useState<Record<string, number>>({});
  const activeConversationIdRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const setActiveConversationId = useCallback((id: string | null) => {
    activeConversationIdRef.current = id;
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/unread", { credentials: "include" });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        total?: number;
        byConversation?: Record<string, number>;
      };
      setUnreadTotal(payload.total ?? 0);
      setByConversation(payload.byConversation ?? {});
    } catch {
      /* ignore */
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
    if (Notification.permission === "granted" || Notification.permission === "denied") {
      return Notification.permission;
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return "denied" as const;
    }
  }, []);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    void requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    const fallback = window.setInterval(() => void refreshUnread(), 30000);
    return () => window.clearInterval(fallback);
  }, [refreshUnread]);

  useEffect(() => {
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let source: EventSource | null = null;

    function connect() {
      if (closed) return;
      source = new EventSource("/api/chat/events");
      source.onmessage = (event) => {
        let payload: ChatStreamEvent;
        try {
          payload = JSON.parse(event.data) as ChatStreamEvent;
        } catch {
          return;
        }

        if (payload.type === "ping") return;

        if (payload.type === "unread") {
          setUnreadTotal(payload.total);
          void refreshUnread();
          return;
        }

        if (payload.type === "message") {
          const viewingThis =
            activeConversationIdRef.current === payload.conversationId && !document.hidden;
          const onChatsList = pathnameRef.current.includes("/chats");

          if (viewingThis) {
            void fetch("/api/chat/read", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId: payload.conversationId }),
            }).then(() => refreshUnread());
            window.dispatchEvent(
              new CustomEvent("gae-chat-message", { detail: payload }),
            );
            return;
          }

          setByConversation((prev) => {
            const nextCount = (prev[payload.conversationId] ?? 0) + 1;
            const next = { ...prev, [payload.conversationId]: nextCount };
            setUnreadTotal(Object.values(next).reduce((sum, value) => sum + value, 0));
            return next;
          });

          window.dispatchEvent(new CustomEvent("gae-chat-message", { detail: payload }));

          if (document.hidden || !onChatsList || activeConversationIdRef.current !== payload.conversationId) {
            const basePath = chatsBasePath(pathnameRef.current);
            showBrowserNotification({
              title: payload.subject || "پیام جدید",
              body: payload.preview || "یک پیام جدید در گفتگو دارید.",
              conversationId: payload.conversationId,
              basePath,
              onClick: () => router.push(`${basePath}/${payload.conversationId}`),
            });
          }
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (!closed) {
          reconnectTimer = setTimeout(connect, 4000);
        }
      };
    }

    connect();
    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [refreshUnread, router]);

  const value = useMemo(
    () => ({
      unreadTotal,
      byConversation,
      setActiveConversationId,
      refreshUnread,
      requestPermission,
    }),
    [unreadTotal, byConversation, setActiveConversationId, refreshUnread, requestPermission],
  );

  return (
    <ChatNotificationsContext.Provider value={value}>{children}</ChatNotificationsContext.Provider>
  );
}

export function useChatNotifications() {
  const ctx = useContext(ChatNotificationsContext);
  if (!ctx) {
    throw new Error("useChatNotifications must be used within ChatNotificationsProvider");
  }
  return ctx;
}

export function useOptionalChatNotifications() {
  return useContext(ChatNotificationsContext);
}
