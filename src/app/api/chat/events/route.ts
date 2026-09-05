import { NextRequest } from "next/server";

import { getServerUser } from "@/lib/auth";
import type { ChatStreamEvent } from "@/lib/chat-event-types";
import { subscribeChatEvents } from "@/lib/chat-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function encodeSse(event: ChatStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "وارد حساب شوید." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const audience = user.role === "lawyer" ? "lawyer" : "user";
  if (audience === "lawyer" && !user.lawyerSlug) {
    return new Response(JSON.stringify({ error: "پروفایل وکیل ناقص است." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: ChatStreamEvent) => {
        if (event.type !== "ping" && event.type !== "message" && event.type !== "unread") return;
        if (event.type !== "ping" && event.forAudience !== audience) return;
        controller.enqueue(encoder.encode(encodeSse(event)));
      };

      cleanup = subscribeChatEvents({
        userId: audience === "user" ? user.id : undefined,
        lawyerSlug: audience === "lawyer" ? user.lawyerSlug ?? undefined : undefined,
        send,
      });

      controller.enqueue(encoder.encode(encodeSse({ type: "ping" })));
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(encodeSse({ type: "ping" })));
        } catch {
          if (heartbeat) clearInterval(heartbeat);
        }
      }, 25000);

      request.signal.addEventListener("abort", () => {
        if (heartbeat) clearInterval(heartbeat);
        cleanup?.();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
