"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircleIcon, PhoneIcon, VideoIcon } from "lucide-react";

import {
  EmptyRow,
  ErrorNote,
  LawyerHeading,
  Tone,
  panelCard,
  panelFetch,
} from "@/components/lawyer/lawyer-ui";
import { SiteDataTable, SiteTableLink } from "@/components/ui/site-data-table";
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
    function onLive() {
      void load();
    }
    window.addEventListener("gae-chat-message", onLive);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("gae-chat-message", onLive);
    };
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
      ) : (
        <div className={cn(panelCard, "overflow-hidden p-0")}>
          <SiteDataTable
            rows={items}
            rowKey={(item) => item.id}
            pageSize={10}
            minWidthClassName="min-w-[48rem]"
            empty={
              <div className="p-6">
                <EmptyRow>گفتگویی در این دسته نیست.</EmptyRow>
              </div>
            }
            columns={[
              {
                id: "index",
                header: "ردیف",
                hideOnMobile: true,
                headerClassName: "px-3 md:px-3",
                className: "px-3 text-center text-navy/40 md:px-3",
                cell: (_row, index) => toFaDigits(index + 1),
              },
              {
                id: "subject",
                header: "موضوع",
                headerClassName: "text-right",
                className: "max-w-[14rem] text-right",
                cell: (item) => {
                  const Icon =
                    item.channel === "video"
                      ? VideoIcon
                      : item.channel === "phone"
                        ? PhoneIcon
                        : MessageCircleIcon;
                  return (
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <SiteTableLink href={`/lawyer/chats/${item.id}`} className="block min-w-0 truncate">
                          {item.subject}
                        </SiteTableLink>
                        {item.unreadCount > 0 ? (
                          <span className="inline-flex shrink-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {toFaDigits(item.unreadCount > 99 ? 99 : item.unreadCount)}
                            {item.unreadCount > 99 ? "+" : ""}
                          </span>
                        ) : null}
                      </div>
                      {item.lastMessage ? (
                        <span className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-navy/45">
                          <Icon className="size-3 shrink-0" />
                          <span className="truncate">{item.lastMessage}</span>
                        </span>
                      ) : null}
                    </div>
                  );
                },
              },
              {
                id: "client",
                header: "موکل",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => item.clientName ?? "—",
              },
              {
                id: "channel",
                header: "کانال",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => consultChannelMeta[item.channel].title,
              },
              {
                id: "tracking",
                header: "کد",
                hideOnMobile: true,
                className: "whitespace-nowrap text-navy/60",
                cell: (item) => toFaDigits(item.trackingCode),
              },
              {
                id: "date",
                header: "زمان",
                className: "whitespace-nowrap text-center text-navy/50",
                cell: (item) => formatFaRelative(item.createdAt),
              },
              {
                id: "flags",
                header: "وضعیت",
                className: "text-center",
                cell: (item) => (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {item.needsReply ? <Tone tone="bg-amber-50 text-amber-800">منتظر پاسخ</Tone> : null}
                    {item.caseId ? <Tone tone="bg-sky-50 text-sky-800">پرونده</Tone> : null}
                    <Tone tone={item.closedAt ? "bg-navy/5 text-navy/55" : "bg-emerald-50 text-emerald-800"}>
                      {item.closedAt ? "بسته" : "فعال"}
                    </Tone>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
