"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneIcon, VideoIcon } from "lucide-react";

import { ConsultDocumentList } from "@/components/consult/document-list";
import { buttonVariants } from "@/components/ui/button";
import type { ClientConversation, ClientMessage } from "@/lib/conversations";
import { consultChannelMeta } from "@/lib/consult";
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ConversationThread({
  conversationId,
  viewer,
}: {
  conversationId: string;
  viewer: "user" | "lawyer";
}) {
  const [summary, setSummary] = useState<ClientConversation | null>(null);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (viewer === "user") {
      const response = await fetch(`/api/conversations/${conversationId}`, { credentials: "include" });
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
      return;
    }
    const response = await fetch("/api/desk", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get", conversationId }),
    });
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
  }, [conversationId, viewer]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setError("دسترسی به دوربین یا میکروفن داده نشد.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
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

  async function video(action: "start" | "end") {
    setPending(true);
    const response = await fetch(`/api/conversations/${conversationId}/video`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "جلسه تصویری انجام نشد.");
      return;
    }
    if (action === "start") await startCamera();
    else stopCamera();
    await load();
  }

  async function submitRating() {
    setPending(true);
    const response = await fetch(`/api/conversations/${conversationId}/rating`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, comment }),
    });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "امتیاز ثبت نشد.");
      return;
    }
    await load();
  }

  if (!summary) {
    return <p className="text-sm text-navy/60">{error ?? "در حال بارگذاری گفتگو…"}</p>;
  }

  const closed = Boolean(summary.closedAt);
  const channel = consultChannelMeta[summary.channel];

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

      {summary.documents?.length ? (
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
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/50">
                {summary.videoLive ? "جلسه در جریان است — برای دیدن تصویر خود وارد شوید." : "هنوز جلسه‌ای شروع نشده."}
              </p>
            )}
          </div>
          {!closed && (
            <div className="mt-3 flex flex-wrap gap-2">
              {!summary.videoLive ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void video("start")}
                  className={cn(buttonVariants(), "h-10 bg-gold text-navy-deep hover:bg-gold-bright")}
                >
                  ورود به تماس تصویری
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void video("end")}
                  className={cn(buttonVariants(), "h-10 bg-white/10 text-white hover:bg-white/20")}
                >
                  پایان جلسه تصویری
                </button>
              )}
            </div>
          )}
          {summary.videoEnded && (
            <p className="mt-3 text-sm text-white/70">جلسه تصویری تمام شد. ادامه ابهام‌ها با گفتگوی متنی است.</p>
          )}
        </div>
      )}

      <div
        ref={scroller}
        className="mt-4 min-h-64 flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/70 p-4 ring-1 ring-navy/8"
      >
        {messages.map((item) => (
          <div
            key={item.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7",
              item.authorRole === "system" && "mx-auto max-w-xl bg-gold/12 text-center text-navy/80",
              item.authorRole === "user" && "ms-auto bg-navy text-white",
              item.authorRole === "lawyer" && "bg-paper text-navy ring-1 ring-navy/8",
            )}
          >
            {item.body}
            <p className={cn("mt-1 text-[10px]", item.authorRole === "user" ? "text-white/50" : "text-navy/40")}>
              {formatFaDateTime(item.createdAt)}
            </p>
          </div>
        ))}
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
      ) : viewer === "user" && !summary.hasRated ? (
        <div className="mt-4 rounded-2xl bg-white/80 p-5 ring-1 ring-navy/8">
          <p className="font-heading font-semibold text-navy">امتیاز به این مشاوره</p>
          <p className="mt-1 text-sm text-navy/60">پس از بسته شدن کامل توسط وکیل می‌توانید امتیاز بدهید.</p>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setScore(item)}
                className={cn(
                  "size-10 rounded-xl text-lg",
                  item <= score ? "bg-gold text-navy-deep" : "bg-paper text-navy/30",
                )}
              >
                {toFaDigits(item)}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="mt-3 min-h-20 w-full rounded-xl border border-navy/15 p-3 text-sm"
            placeholder="توضیح اختیاری"
            maxLength={500}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => void submitRating()}
            className={cn(buttonVariants(), "mt-3 h-10 bg-navy px-5 text-white hover:bg-navy-mid")}
          >
            ثبت امتیاز
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-navy/55">
          {summary.hasRated
            ? `امتیاز شما: ${toFaDigits(summary.ratingScore ?? 0)} از ۵`
            : "این گفتگو بسته شده است."}
        </p>
      )}

    </div>
  );
}
