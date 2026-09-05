"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneIcon, VideoIcon } from "lucide-react";

import { ConsultDocumentList } from "@/components/consult/document-list";
import { ConversationRatingDialog } from "@/components/account/conversation-rating-dialog";
import { DocumentRequestCard } from "@/components/account/document-request-card";
import { useOptionalChatNotifications } from "@/components/chat/chat-notifications-provider";
import { Stars } from "@/components/lawyers/stars";
import { buttonVariants } from "@/components/ui/button";
import type { ClientConversation, ClientMessage } from "@/lib/conversations";
import type { ChatStreamEvent } from "@/lib/chat-event-types";
import type { ClientDocumentRequest } from "@/lib/document-request-types";
import { consultChannelMeta } from "@/lib/consult";
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ConversationThread({
  conversationId,
  viewer,
  hideDocuments = false,
}: {
  conversationId: string;
  viewer: "user" | "lawyer";
  hideDocuments?: boolean;
}) {
  const [summary, setSummary] = useState<ClientConversation | null>(null);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [docRequests, setDocRequests] = useState<ClientDocumentRequest[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const ratingPromptedRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const chat = useOptionalChatNotifications();

  const markRead = useCallback(async () => {
    try {
      await fetch("/api/chat/read", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      await chat?.refreshUnread();
    } catch {
      /* ignore */
    }
  }, [chat, conversationId]);

  const load = useCallback(async () => {
    const requestsPromise = fetch(`/api/conversations/${conversationId}/document-requests`, {
      credentials: "include",
    }).then(async (response) => {
      if (!response.ok) return [] as ClientDocumentRequest[];
      const payload = (await response.json()) as { items?: ClientDocumentRequest[] };
      return payload.items ?? [];
    });

    if (viewer === "user") {
      const [response, requests] = await Promise.all([
        fetch(`/api/conversations/${conversationId}`, { credentials: "include" }),
        requestsPromise,
      ]);
      const payload = (await response.json()) as {
        summary?: ClientConversation;
        messages?: ClientMessage[];
        error?: string;
      };
      if (!response.ok || !payload.summary) {
        setError(payload.error ?? "گفتگو بارگذاری نشد.");
        return;
      }
      setSummary(payload.summary);
      setMessages(payload.messages ?? []);
      setDocRequests(requests);
      return;
    }
    const [response, requests] = await Promise.all([
      fetch("/api/desk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", conversationId }),
      }),
      requestsPromise,
    ]);
    const payload = (await response.json()) as {
      summary?: ClientConversation;
      messages?: ClientMessage[];
      error?: string;
    };
    if (!response.ok || !payload.summary) {
      setError(payload.error ?? "گفتگو بارگذاری نشد.");
      return;
    }
    setSummary(payload.summary);
    setMessages(payload.messages ?? []);
    setDocRequests(requests);
  }, [conversationId, viewer]);

  useEffect(() => {
    chat?.setActiveConversationId(conversationId);
    void markRead();
    return () => {
      chat?.setActiveConversationId(null);
    };
  }, [chat, conversationId, markRead]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    function onLiveMessage(event: Event) {
      const detail = (event as CustomEvent<ChatStreamEvent>).detail;
      if (!detail || detail.type !== "message") return;
      if (detail.conversationId !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === detail.message.id)) return prev;
        return [...prev, detail.message];
      });
      if (!document.hidden) void markRead();
    }
    window.addEventListener("gae-chat-message", onLiveMessage);
    return () => window.removeEventListener("gae-chat-message", onLiveMessage);
  }, [conversationId, markRead]);

  useEffect(() => {
    function onVisibility() {
      if (!document.hidden) void markRead();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [markRead]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function requestMediaStream() {
    if (!window.isSecureContext) {
      throw Object.assign(new Error("insecure"), { name: "SecurityError" });
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw Object.assign(new Error("unsupported"), { name: "NotSupportedError" });
    }

    // بدون قید facingMode؛ روی دسکتاپ پایدارتر است و دیالوگ اجازه را باز می‌کند
    try {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (firstError) {
      const name = firstError instanceof DOMException ? firstError.name : "";
      if (name === "NotFoundError" || name === "NotReadableError" || name === "OverconstrainedError") {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      // اگر فقط میکروفن رد شده، فقط دوربین را بخواه
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      throw firstError;
    }
  }

  function mediaErrorMessage(error: unknown) {
    const name = error instanceof DOMException || (error && typeof error === "object" && "name" in error)
      ? String((error as { name: string }).name)
      : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "درخواست دسترسی رد شد. دوباره روی دکمه بزنید تا درخواست دوربین و میکروفن باز شود.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "دوربینی روی این دستگاه پیدا نشد.";
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
      return "دوربین در برنامه دیگری در حال استفاده است. آن را ببندید و دوباره تلاش کنید.";
    }
    if (name === "SecurityError") {
      return "برای دسترسی به دوربین باید صفحه روی localhost یا HTTPS باشد.";
    }
    if (name === "NotSupportedError") {
      return "این مرورگر از دسترسی به دوربین پشتیبانی نمی‌کند.";
    }
    return "اتصال به دوربین برقرار نشد. دوباره تلاش کنید.";
  }

  async function startCamera() {
    setVideoError(null);
    try {
      const stream = await requestMediaStream();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      const node = videoRef.current;
      if (node) {
        node.srcObject = stream;
        node.muted = true;
        try {
          await node.play();
        } catch {
          // autoplay may be blocked briefly; srcObject is still attached
        }
      }
      setCameraOn(true);
      return true;
    } catch (error) {
      setVideoError(mediaErrorMessage(error));
      return false;
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function joinVideo() {
    setPending(true);
    setError(null);
    setVideoError(null);

    // اول مستقیم درخواست دسترسی دوربین/میکروفن مرورگر را باز کن
    const ok = await startCamera();
    if (!ok) {
      setPending(false);
      return;
    }

    // بعد وضعیت جلسه را در سرور ثبت کن
    if (!summary?.videoLive) {
      const response = await fetch(`/api/conversations/${conversationId}/video`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        stopCamera();
        setPending(false);
        setVideoError(payload.error ?? "شروع جلسه تصویری انجام نشد.");
        return;
      }
    }

    setPending(false);
    await load();
  }

  async function endVideo() {
    setPending(true);
    setError(null);
    setVideoError(null);
    const response = await fetch(`/api/conversations/${conversationId}/video`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setVideoError(payload.error ?? "پایان جلسه تصویری انجام نشد.");
      return;
    }
    stopCamera();
    await load();
  }

  async function send() {
    if (!text.trim()) return;
    setPending(true);
    setError(null);
    const url = viewer === "lawyer" ? "/api/desk" : `/api/conversations/${conversationId}/messages`;
    const body =
      viewer === "lawyer"
        ? { action: "message", conversationId, body: text }
        : { body: text };
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "ارسال نشد.");
      return;
    }
    setText("");
    await load();
  }

  useEffect(() => {
    if (viewer !== "user" || !summary?.closedAt || summary.hasRated) return;
    if (ratingPromptedRef.current === conversationId) return;
    ratingPromptedRef.current = conversationId;
    setRatingOpen(true);
  }, [viewer, summary?.closedAt, summary?.hasRated, conversationId]);

  if (!summary) {
    return <p className="text-sm text-navy/60">{error ?? "در حال بارگذاری گفتگو…"}</p>;
  }

  const closed = Boolean(summary.closedAt);
  const channel = consultChannelMeta[summary.channel];
  const canRate = viewer === "user" && closed && !summary.hasRated;

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div
        className={
          viewer === "lawyer"
            ? "border border-navy/10 bg-white px-5 py-5"
            : "rounded-[1.4rem] bg-navy px-5 py-5 text-white shadow-lg shadow-navy/20"
        }
      >
        <p className={viewer === "lawyer" ? "text-[11px] font-medium tracking-[0.14em] text-navy/40" : "text-sm font-medium text-gold"}>
          {channel.title}
        </p>
        {viewer === "lawyer" ? null : <span className="mt-3 block h-1 w-12 rounded-full bg-gold" />}
        <h1 className={viewer === "lawyer" ? "mt-3 font-heading text-2xl font-semibold text-navy" : "mt-4 font-heading text-2xl font-bold"}>
          {summary.subject}
        </h1>
        <p className={viewer === "lawyer" ? "mt-2 text-sm text-navy/50" : "mt-2 text-sm text-white/70"}>
          {summary.lawyerName} · کد {toFaDigits(summary.trackingCode)}
        </p>
      </div>

      {!hideDocuments && summary.documents?.length ? (
        <div
          className={
            viewer === "lawyer"
              ? "mt-4 border border-navy/10 bg-white p-4"
              : "mt-4 rounded-2xl bg-white/80 p-4 ring-1 ring-navy/8"
          }
        >
          <p className="text-xs font-medium text-navy/50">مدارک پیوست درخواست</p>
          <ConsultDocumentList trackingCode={summary.trackingCode} items={summary.documents} />
        </div>
      ) : null}

      {summary.channel === "phone" && (
        <div
          className={
            viewer === "lawyer"
              ? "mt-4 border border-navy/10 bg-white p-4 text-sm leading-7 text-navy/70"
              : "mt-4 rounded-2xl border border-gold/20 bg-white/80 p-4 text-sm leading-7 text-navy/75"
          }
        >
          <p className="flex items-center gap-2 font-medium text-navy">
            <PhoneIcon className="size-4 text-gold-deep" />
            تماس تلفنی خارج از برنامه
          </p>
          <p className="mt-1">
            {summary.phoneCallDone
              ? "وکیل انجام تماس را ثبت کرده است. ابهام‌های باقی‌مانده را همین‌جا متنی بپرسید."
              : "دفتر در ساعات کاری تماس می‌گیرد. تا ثبت انجام تماس توسط وکیل، هماهنگی را می‌توانید همین‌جا بنویسید."}
          </p>
        </div>
      )}

      {summary.channel === "video" && (
        <div className="mt-4 overflow-hidden rounded-2xl bg-navy-deep p-4 text-white">
          <p className="flex items-center gap-2 text-sm font-medium text-gold">
            <VideoIcon className="size-4" />
            جلسه تصویری داخل برنامه
          </p>
          <div className="relative mt-3 aspect-video overflow-hidden rounded-xl bg-black/40">
            <video ref={videoRef} className="size-full object-cover" autoPlay muted playsInline />
            {!cameraOn && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-white/55">
                {summary.videoLive
                  ? "جلسه شروع شده است. برای پیش‌نمایش تصویر خود، دوربین را روشن کنید."
                  : "هنوز جلسه‌ای شروع نشده."}
              </p>
            )}
          </div>
          {!closed && (
            <div className="mt-3 flex flex-wrap gap-2">
              {!cameraOn ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void joinVideo()}
                  className={cn(buttonVariants(), "h-10 bg-gold text-navy-deep hover:bg-gold-bright")}
                >
                  {summary.videoLive ? "درخواست دسترسی و روشن کردن دوربین" : "شروع تماس و درخواست دوربین"}
                </button>
              ) : null}
              {summary.videoLive || cameraOn ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void endVideo()}
                  className={cn(buttonVariants(), "h-10 bg-white/10 text-white hover:bg-white/20")}
                >
                  پایان جلسه تصویری
                </button>
              ) : null}
            </div>
          )}
          {videoError && (
            <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-100" role="alert">
              {videoError}
            </p>
          )}
          {summary.videoEnded && !summary.videoLive && (
            <p className="mt-3 text-sm text-white/70">جلسه تصویری تمام شد. ادامه ابهام‌ها با گفتگوی متنی است.</p>
          )}
        </div>
      )}

      <div
        ref={scroller}
        className="mt-4 min-h-64 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/70 p-4 ring-1 ring-navy/8"
      >
        {messages.map((item) => {
          const linkedRequest = docRequests.find((request) => request.messageId === item.id);
          if (linkedRequest) {
            return (
              <div key={item.id} className="mx-auto w-full max-w-xl">
                <DocumentRequestCard
                  request={linkedRequest}
                  viewer={viewer}
                  onUpdated={(next) =>
                    setDocRequests((current) =>
                      current.map((request) => (request.id === next.id ? next : request)),
                    )
                  }
                />
                <p className="mt-1 text-center text-[10px] text-navy/40">{formatFaDateTime(item.createdAt)}</p>
              </div>
            );
          }
          return (
            <div
              key={item.id}
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7",
                item.authorRole === "system" && "mx-auto max-w-xl bg-gold/12 text-center text-navy/80",
                item.authorRole === "user" && "ms-auto bg-navy text-white",
                item.authorRole === "lawyer" && "bg-paper text-navy ring-1 ring-navy/8",
              )}
            >
              <span className="whitespace-pre-line">{item.body}</span>
              <p className={cn("mt-1 text-[10px]", item.authorRole === "user" ? "text-white/50" : "text-navy/40")}>
                {formatFaDateTime(item.createdAt)}
              </p>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {!closed ? (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="h-12 flex-1 rounded-xl border border-navy/15 bg-white px-4 text-sm outline-none ring-gold/40 focus:ring-2"
            placeholder="پیام خود را بنویسید…"
            maxLength={4000}
          />
          <button
            type="submit"
            disabled={pending}
            className={cn(buttonVariants(), "h-12 bg-gold px-5 text-navy-deep hover:bg-gold-bright")}
          >
            ارسال
          </button>
        </form>
      ) : canRate ? (
        <div className="mt-4 rounded-2xl border border-gold/25 bg-gradient-to-l from-gold-wash/70 to-white p-5 shadow-sm">
          <p className="font-heading text-base font-semibold text-navy">گفتگو بسته شد</p>
          <p className="mt-1 text-sm leading-7 text-navy/65">
            با ثبت امتیاز، به بهبود کیفیت مشاوره کمک می‌کنید.
          </p>
          <button
            type="button"
            onClick={() => setRatingOpen(true)}
            className={cn(buttonVariants(), "mt-4 h-11 w-full bg-navy text-white hover:bg-navy-mid sm:w-auto sm:px-6")}
          >
            ثبت امتیاز با ستاره
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3.5 ring-1 ring-navy/8">
          {summary.hasRated ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-navy/70">امتیاز شما:</p>
              <Stars rating={summary.ratingScore ?? 0} size="md" />
              <span className="text-sm text-navy/50">{toFaDigits(summary.ratingScore ?? 0)} از ۵</span>
            </div>
          ) : (
            <p className="text-sm text-navy/55">این گفتگو بسته شده است.</p>
          )}
        </div>
      )}

      {viewer === "user" ? (
        <ConversationRatingDialog
          open={ratingOpen}
          onOpenChange={setRatingOpen}
          lawyerName={summary.lawyerName}
          subject={summary.subject}
          conversationId={conversationId}
          onSubmitted={(score) => {
            setSummary((prev) =>
              prev ? { ...prev, hasRated: true, ratingScore: score } : prev,
            );
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
