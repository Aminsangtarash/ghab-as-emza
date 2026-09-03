import Link from "next/link";
import { MessageCircleIcon, PhoneIcon, VideoIcon } from "lucide-react";

import type { ClientConversation } from "@/lib/conversations";
import { consultChannelMeta } from "@/lib/consult";
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ConversationList({
  items,
  hrefFor,
  audience = "client",
}: {
  items: ClientConversation[];
  hrefFor: (item: ClientConversation) => string;
  audience?: "client" | "lawyer";
}) {
  const lawyer = audience === "lawyer";

  if (items.length === 0) {
    return (
      <div
        className={
          lawyer
            ? "mt-8 border border-dashed border-navy/15 bg-white px-5 py-12 text-center"
            : "mt-8 rounded-2xl border border-gold/20 bg-white/70 px-5 py-12 text-center shadow-sm"
        }
      >
        {lawyer ? null : (
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
            <MessageCircleIcon className="size-5" />
          </span>
        )}
        <p className={cn("font-heading font-semibold text-navy", lawyer ? "" : "mt-4")}>هنوز گفتگویی باز نشده</p>
        <p className="mt-2 text-sm leading-7 text-navy/60">
          {lawyer
            ? "پس از پذیرش درخواست، گفتگو اینجا می‌آید."
            : "پس از تأیید وکیل، گفتگوی متنی، تماس تصویری یا هماهنگی تماس تلفنی همین‌جا می‌آید."}
        </p>
      </div>
    );
  }

  return (
    <div className={lawyer ? "mt-8 divide-y divide-navy/8 overflow-hidden border border-navy/10 bg-white" : "mt-8 space-y-3"}>
      {items.map((item) => {
        const Icon = item.channel === "video" ? VideoIcon : item.channel === "phone" ? PhoneIcon : MessageCircleIcon;
        return (
          <Link
            key={item.id}
            href={hrefFor(item)}
            className={
              lawyer
                ? "block px-5 py-4 transition hover:bg-navy/[0.03]"
                : "block rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-navy/8 transition hover:ring-gold/35 sm:p-5"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-heading font-semibold text-navy">{item.subject}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-navy/60">
                  <Icon className={cn("size-3.5", lawyer ? "text-navy/40" : "text-gold-deep")} />
                  {consultChannelMeta[item.channel].title}
                  {lawyer ? null : ` · ${item.lawyerName}`}
                </p>
              </div>
              <span
                className={
                  lawyer
                    ? "text-[11px] text-navy/45"
                    : "rounded-full bg-gold/15 px-2.5 py-1 text-[11px] text-gold-deep"
                }
              >
                {item.closedAt ? "بسته" : "فعال"}
              </span>
            </div>
            {item.lastMessage && (
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-navy/55">{item.lastMessage}</p>
            )}
            <p className="mt-3 text-xs text-navy/40">
              {toFaDigits(item.trackingCode)} · {formatFaDateTime(item.createdAt)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
