"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { formatToman } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RequestActions({
  trackingCode,
  conversationId,
  cancellable,
  deletable = false,
  feeToman,
  tone = "default",
  compact = false,
}: {
  trackingCode: string;
  conversationId?: string;
  cancellable: boolean;
  deletable?: boolean;
  feeToman: number;
  tone?: "default" | "on-dark";
  compact?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function cancel() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/consultations/${encodeURIComponent(trackingCode)}/cancel`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const payload = (await response.json()) as { error?: string; refunded?: number };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "لغو انجام نشد.");
      return;
    }
    router.refresh();
  }

  async function removeCancelled() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/consultations/${encodeURIComponent(trackingCode)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "حذف انجام نشد.");
      setConfirmDelete(false);
      return;
    }
    router.push("/account/requests");
    router.refresh();
  }

  const onDark = tone === "on-dark";
  const hasActions = Boolean(conversationId || cancellable || deletable);
  if (!hasActions && !error) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact ? "mt-3" : "mt-6")}>
      {conversationId && (
        <a
          href={`/account/chats/${conversationId}`}
          className={cn(buttonVariants(), "h-10 bg-gold px-4 text-navy-deep hover:bg-gold-bright")}
        >
          ورود به گفتگو
        </a>
      )}
      {cancellable && (
        <button
          type="button"
          disabled={pending}
          onClick={() => void cancel()}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-10",
            onDark
              ? "border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              : "border-navy/20",
          )}
        >
          لغو درخواست
          {feeToman > 0 ? ` و برگشت ${formatToman(feeToman)} به کیف پول` : ""}
        </button>
      )}
      {deletable && !confirmDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmDelete(true)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-10",
            onDark
              ? "border-red-300/40 bg-white/5 text-red-100 hover:bg-white/10 hover:text-white"
              : "border-red-200 text-red-800 hover:bg-red-50",
          )}
        >
          حذف از فهرست
        </button>
      )}
      {deletable && confirmDelete && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => void removeCancelled()}
            className={cn(buttonVariants(), "h-10 bg-red-700 px-4 text-white hover:bg-red-800")}
          >
            حذف قطعی
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmDelete(false)}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10",
              onDark ? "border-white/20 text-white hover:bg-white/10 hover:text-white" : "border-navy/20",
            )}
          >
            انصراف
          </button>
          <p className={cn("w-full text-xs leading-6", onDark ? "text-white/60" : "text-navy/50")}>
            از فهرست درخواست‌ها حذف می‌شود. گردش کیف پول باقی می‌ماند.
          </p>
        </>
      )}
      {error && <p className={cn("w-full text-sm", onDark ? "text-red-200" : "text-red-800")}>{error}</p>}
    </div>
  );
}
