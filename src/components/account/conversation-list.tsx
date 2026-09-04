"use client";

import { MessageCircleIcon, PhoneIcon, VideoIcon } from "lucide-react";

import { SiteDataTable, SiteTableLink } from "@/components/ui/site-data-table";
import type { ClientConversation } from "@/lib/conversations";
import { consultChannelMeta } from "@/lib/consult";
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ConversationList({
  items,
  audience = "client",
}: {
  items: ClientConversation[];
  audience?: "client" | "lawyer";
}) {
  const lawyer = audience === "lawyer";
  const chatHref = (id: string) => (lawyer ? `/lawyer/chats/${id}` : `/account/chats/${id}`);

  return (
    <div
      className={cn(
        "mt-8 overflow-hidden",
        lawyer
          ? "border border-navy/10 bg-white"
          : "rounded-[1.35rem] border border-navy/10 bg-white shadow-sm",
      )}
    >
      <SiteDataTable
        rows={items}
        rowKey={(item) => item.id}
        pageSize={10}
        minWidthClassName="min-w-[42rem]"
        empty={
          <div className={lawyer ? "px-5 py-12 text-center" : "px-5 py-12 text-center"}>
            {lawyer ? null : (
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
                <MessageCircleIcon className="size-5" />
              </span>
            )}
            <p className={cn("font-heading font-semibold text-navy", lawyer ? "" : "mt-4")}>
              هنوز گفتگویی باز نشده
            </p>
            <p className="mt-2 text-sm leading-7 text-navy/60">
              {lawyer
                ? "پس از پذیرش درخواست، گفتگو اینجا می‌آید."
                : "پس از تأیید وکیل، گفتگوی متنی، تماس تصویری یا هماهنگی تماس تلفنی همین‌جا می‌آید."}
            </p>
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
            className: "max-w-[16rem] text-right",
            cell: (item) => {
              const Icon =
                item.channel === "video" ? VideoIcon : item.channel === "phone" ? PhoneIcon : MessageCircleIcon;
              return (
                <div className="min-w-0">
                  <SiteTableLink href={chatHref(item.id)} className="block truncate">
                    {item.subject}
                  </SiteTableLink>
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
            id: "channel",
            header: "کانال",
            hideOnMobile: true,
            className: "whitespace-nowrap text-navy/60",
            cell: (item) => consultChannelMeta[item.channel].title,
          },
          {
            id: "party",
            header: lawyer ? "موکل" : "وکیل",
            hideOnMobile: true,
            className: "whitespace-nowrap text-navy/60",
            cell: (item) => (lawyer ? item.clientName ?? "—" : item.lawyerName),
          },
          {
            id: "tracking",
            header: "کد پیگیری",
            hideOnMobile: true,
            className: "whitespace-nowrap text-navy/60",
            cell: (item) => toFaDigits(item.trackingCode),
          },
          {
            id: "date",
            header: "تاریخ",
            className: "whitespace-nowrap text-center text-navy/50",
            cell: (item) => formatFaDateTime(item.createdAt),
          },
          {
            id: "status",
            header: "وضعیت",
            className: "text-center",
            cell: (item) => (
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                  item.closedAt ? "bg-navy/5 text-navy/55" : "bg-emerald-50 text-emerald-800",
                )}
              >
                {item.closedAt ? "بسته" : "فعال"}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
