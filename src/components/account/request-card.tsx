import Link from "next/link";

import { StatusBadge } from "@/components/account/status-badge";
import { consultChannelMeta } from "@/lib/consult";
import { formatFaDateTime, toFaDigits } from "@/lib/format";
import type { ClientConsultation } from "@/lib/store";

export function RequestCard({ item }: { item: ClientConsultation }) {
  return (
    <Link
      href={`/account/requests/${item.trackingCode}`}
      className="block rounded-2xl border border-navy/10 bg-paper/60 p-4 transition hover:border-gold/40 hover:bg-gold/5 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-base font-semibold text-navy">{item.subject}</p>
          <p className="mt-1 text-sm text-navy/60">
            {item.serviceTitle} · {consultChannelMeta[item.channel].title}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-navy/50">
        <span dir="ltr">{toFaDigits(item.trackingCode)}</span>
        <span>{formatFaDateTime(item.createdAt)}</span>
      </div>
    </Link>
  );
}
