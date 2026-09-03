"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircleIcon, PhoneIcon, VideoIcon } from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  LawyerHeading,
  Tone,
  panelCard,
  panelFetch,
} from "@/components/lawyer/lawyer-ui";
import { consultChannelMeta } from "@/lib/consult";
import type { ClientConversation } from "@/lib/conversations";
import { formatFaRelative, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "all", label: "همه" },
  { id: "needs-reply", label: "منتظر پاسخ من" },
  { id: "open", label: "فعال" },
  { id: "closed", label: "بسته‌شده" },
] as const;

type Filter = (typeof tabs)[number]["id"];

export function LawyerChats({ initialFilter = "all" }: { initialFilter?: string }) {
  const [filter, setFilter] = useState<Filter>(
    tabs.some((tab) => tab.id === initialFilter) ? (initialFilter as Filter) : "all",
  );
  const [items, setItems] = useState<ClientConversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await panelFetch<{ items: ClientConversation[] }>(
      `/api/lawyer/conversations?filter=${filter}`,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setItems(result.data.items);
  }, [filter]);

  useEffect(() => {
    setItems(null);
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div className="min-w-0 space-y-4 md:space-y-5">
      <LawyerHeading
        kicker="ارتباط با موکل"
        title="گفتگوها"
        description="گفتگوی متنی، جلسه تصویری، ثبت تماس تلفنی، یادداشت خصوصی و تشکیل پرونده از داخل هر گفتگو انجام می‌شود."
      />

      <div className={cn(panelCard, "flex flex-wrap gap-2 px-4 py-3")}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition",
              filter === tab.id ? "bg-navy text-white" : "bg-paper text-navy/60 hover:bg-navy/5",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ErrorNote>{error}</ErrorNote>

      {items === null ? (
        <div className={cn(panelCard, "px-6 py-10 text-sm text-navy/50")}>در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div className={cn(panelCard, "px-6 py-10")}>
          <EmptyRow>گفتگویی در این دسته نیست.</EmptyRow>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const Icon =
              item.channel === "video" ? VideoIcon : item.channel === "phone" ? PhoneIcon : MessageCircleIcon;
            return (
              <li key={item.id}>
                <Link
                  href={`/lawyer/chats/${item.id}`}
                  className={cn(panelCard, "block px-5 py-4 transition hover:border-gold/40 hover:shadow-md")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-navy">{item.subject}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-navy/55">
                        <Icon className="size-3.5 text-navy/40" />
                        {consultChannelMeta[item.channel].title}
                        {item.clientName ? ` · ${item.clientName}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.needsReply ? <Tone tone="bg-amber-50 text-amber-800">منتظر پاسخ</Tone> : null}
                      {item.caseId ? <Tone tone="bg-sky-50 text-sky-800">پرونده دارد</Tone> : null}
                      <Tone tone={item.closedAt ? "bg-navy/5 text-navy/55" : "bg-emerald-50 text-emerald-800"}>
                        {item.closedAt ? "بسته" : "فعال"}
                      </Tone>
                    </div>
                  </div>
                  {item.lastMessage ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-navy/55">{item.lastMessage}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-navy/40">
                    {toFaDigits(item.trackingCode)} · {formatFaRelative(item.createdAt)}
                    {item.ratingScore ? ` · امتیاز ${toFaDigits(item.ratingScore)} از ۵` : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
