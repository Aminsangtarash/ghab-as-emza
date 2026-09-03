import Link from "next/link";

import { RequestActions } from "@/components/account/request-actions";
import { StatusBadge } from "@/components/account/status-badge";
import { consultChannelMeta } from "@/lib/consult";
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import type { ClientConsultation } from "@/lib/store";

export function RequestCard({ item }: { item: ClientConsultation }) {
  const cancelled = item.status === "cancelled";

  return (
    <article className="rounded-2xl border border-navy/8 bg-white/85 shadow-sm ring-1 ring-navy/5 transition hover:-translate-y-0.5 hover:border-gold/35 hover:bg-white hover:shadow-md hover:shadow-navy/5">
      <Link href={`/account/requests/${item.trackingCode}`} className="block p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-base font-semibold text-navy">{item.subject}</p>
            <p className="mt-1 text-sm text-navy/60">
              {item.serviceTitle} · {consultChannelMeta[item.channel].title}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>
        {item.conversationId ? (
          <p className="mt-3 text-xs font-medium text-gold-deep">گفتگو باز است — از جزئیات درخواست وارد شوید</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-navy/6 pt-3 text-xs text-navy/50">
          <span className="rounded-full bg-paper px-2.5 py-1 font-medium text-navy/70">
            {toFaDigits(item.trackingCode)}
          </span>
          <span>{formatFaDateTime(item.createdAt)}</span>
        </div>
      </Link>
      {cancelled ? (
        <div className="border-t border-navy/6 px-4 pb-4 sm:px-5">
          <RequestActions
            trackingCode={item.trackingCode}
            cancellable={false}
            deletable
            feeToman={0}
            compact
          />
        </div>
      ) : null}
    </article>
  );
}
