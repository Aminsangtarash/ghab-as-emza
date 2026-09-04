"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon, ZapIcon } from "lucide-react";

import { RequestActions } from "@/components/account/request-actions";
import { buttonVariants } from "@/components/ui/button";
import { consultChannelMeta, type ConsultChannel, type ConsultationStatus } from "@/lib/consult";
import { formatToman, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type UrgentMatchStatus = {
  trackingCode: string;
  status: ConsultationStatus;
  phase: "searching" | "operator" | "connected" | "cancelled" | "closed";
  createdAt: string;
  slaEndsAt: string;
  cityPriorityEndsAt?: string;
  cityPriorityActive: boolean;
  city?: string;
  conversationId?: string;
  lawyerName?: string;
  channel: ConsultChannel;
  subject: string;
  feeToman: number;
};

export function UrgentWaitingRoom({ trackingCode }: { trackingCode: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<UrgentMatchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const response = await fetch(
      `/api/consultations/${encodeURIComponent(trackingCode)}/match`,
      { credentials: "include" },
    );
    const payload = (await response.json()) as UrgentMatchStatus & { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "وضعیت بارگذاری نشد.");
      return;
    }
    setError(null);
    setStatus(payload);
    if (payload.phase === "connected" && payload.conversationId) {
      router.replace(`/account/chats/${payload.conversationId}`);
    }
  }, [router, trackingCode]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), 3000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, [load]);

  const remainingMs = status ? Math.max(0, new Date(status.slaEndsAt).getTime() - now) : 0;
  const remainingMin = Math.floor(remainingMs / 60_000);
  const remainingSec = Math.floor((remainingMs % 60_000) / 1000);

  return (
    <div className="mx-auto max-w-xl">
      <div className="overflow-hidden rounded-[1.5rem] border border-navy/10 bg-white shadow-sm">
        <div className="bg-navy px-6 py-8 text-center text-white">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold/20 text-gold">
            {status?.phase === "searching" ? (
              <LoaderCircleIcon className="size-7 animate-spin" />
            ) : (
              <ZapIcon className="size-7" />
            )}
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold">
            {status?.phase === "operator"
              ? "در حال ارجاع به اپراتور"
              : status?.phase === "cancelled"
                ? "درخواست لغو شد"
                : "در حال یافتن وکیل…"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/70">
            {status?.phase === "operator"
              ? "هنوز وکیلی پذیرش نکرده؛ اپراتور متخصص مناسب را معرفی می‌کند."
              : status?.phase === "cancelled"
                ? "در صورت پرداخت، مبلغ به کیف پول برگشته است."
                : status?.cityPriorityActive
                  ? `ابتدا وکلای هم‌شهر${status.city ? ` (${status.city})` : ""} مطلع می‌شوند؛ اگر کسی نپذیرفت، صف برای همه باز می‌شود.`
                  : "درخواست شما برای وکلای آماده‌به‌کار پخش شده است. با اولین پذیرش وارد گفتگو می‌شوید."}
          </p>
        </div>

        <div className="space-y-4 px-6 py-6">
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          {status ? (
            <>
              <InfoRow label="موضوع" value={status.subject} />
              {status.city ? <InfoRow label="شهر" value={status.city} /> : null}
              <InfoRow label="کد پیگیری" value={toFaDigits(status.trackingCode)} />
              <InfoRow
                label="کانال"
                value={consultChannelMeta[status.channel as ConsultChannel]?.title ?? status.channel}
              />
              <InfoRow label="مبلغ" value={formatToman(status.feeToman)} />
              {status.phase === "searching" ? (
                <div className="rounded-2xl bg-gold/10 px-4 py-3 text-center">
                  <p className="text-xs text-gold-deep">مهلت یافتن وکیل</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-navy" dir="ltr">
                    {toFaDigits(String(remainingMin).padStart(2, "0"))}:
                    {toFaDigits(String(remainingSec).padStart(2, "0"))}
                  </p>
                </div>
              ) : null}
              {status.lawyerName ? <InfoRow label="وکیل" value={status.lawyerName} /> : null}

              <RequestActions
                trackingCode={status.trackingCode}
                conversationId={status.conversationId}
                cancellable={
                  status.status === "awaiting-lawyer" || status.status === "awaiting-operator"
                }
                feeToman={status.feeToman}
              />
            </>
          ) : (
            <p className="text-center text-sm text-navy/55">در حال دریافت وضعیت…</p>
          )}

          <Link
            href={`/account/requests/${encodeURIComponent(trackingCode)}`}
            className={cn(buttonVariants({ variant: "ghost" }), "h-10 w-full text-navy/60")}
          >
            جزئیات درخواست
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-navy/6 pb-3 text-sm last:border-b-0">
      <span className="text-navy/45">{label}</span>
      <span className="max-w-[70%] text-end font-medium text-navy">{value}</span>
    </div>
  );
}
