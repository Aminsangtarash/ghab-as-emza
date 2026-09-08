"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { lawyers } from "@/lib/data";
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
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function cancel() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/consultations/${encodeURIComponent(trackingCode)}/cancel`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "ثبت انصراف انجام نشد.");
      setConfirmCancel(false);
      return;
    }
    setConfirmCancel(false);
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

  const btnH = compact ? "h-8 px-2.5 text-[11px]" : "h-10";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact ? "justify-center" : "mt-6")}>
      {conversationId && (
        <a
          href={`/account/chats/${conversationId}`}
          className={cn(buttonVariants(), btnH, "bg-gold px-4 text-navy-deep hover:bg-gold-bright")}
        >
          ورود به گفتگو
        </a>
      )}
      {cancellable && !confirmCancel && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmCancel(true)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            btnH,
            onDark
              ? "border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              : "border-navy/20",
          )}
        >
          انصراف از درخواست
        </button>
      )}
      {cancellable && confirmCancel && (
        <>
          <p className={cn("w-full text-sm leading-7", onDark ? "text-white/75" : "text-navy/70")}>
            مطمئن هستید؟ پس از تأیید مدیر سیستم،{" "}
            {feeToman > 0 ? `مبلغ ${formatToman(feeToman)} به کیف پول شما برمی‌گردد` : "درخواست لغو می‌شود"}؛ تا
            آن زمان مبلغ محفوظ می‌ماند.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => void cancel()}
            className={cn(buttonVariants(), btnH, "bg-red-700 px-4 text-white hover:bg-red-800")}
          >
            بله، درخواست انصراف
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmCancel(false)}
            className={cn(
              buttonVariants({ variant: "outline" }),
              btnH,
              onDark ? "border-white/20 text-white hover:bg-white/10 hover:text-white" : "border-navy/20",
            )}
          >
            خیر
          </button>
        </>
      )}
      {deletable && !confirmDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmDelete(true)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            btnH,
            onDark
              ? "border-red-300/40 bg-white/5 text-red-100 hover:bg-white/10 hover:text-white"
              : "border-red-200 text-red-800 hover:bg-red-50",
          )}
        >
          {compact ? "حذف" : "حذف از فهرست"}
        </button>
      )}
      {deletable && confirmDelete && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => void removeCancelled()}
            className={cn(buttonVariants(), btnH, "bg-red-700 px-4 text-white hover:bg-red-800")}
          >
            حذف قطعی
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmDelete(false)}
            className={cn(
              buttonVariants({ variant: "outline" }),
              btnH,
              onDark ? "border-white/20 text-white hover:bg-white/10 hover:text-white" : "border-navy/20",
            )}
          >
            انصراف
          </button>
        </>
      )}
      {error && <p className={cn("w-full text-sm", onDark ? "text-red-200" : "text-red-800")}>{error}</p>}
    </div>
  );
}

export function RequestReselectPanel({
  trackingCode,
  rejectedLawyerSlugs = [],
  lastRejectReason,
}: {
  trackingCode: string;
  rejectedLawyerSlugs?: string[];
  lastRejectReason?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lawyerSlug, setLawyerSlug] = useState("");

  const options = lawyers.filter((lawyer) => !rejectedLawyerSlugs.includes(lawyer.slug));

  async function submit(mode: "chosen" | "assign") {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/consultations/${encodeURIComponent(trackingCode)}/reselect`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "assign" ? { mode: "assign" } : { mode: "chosen", lawyerSlug }),
    });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "انتخاب مجدد انجام نشد.");
      return;
    }
    router.refresh();
  }

  return (
    <section className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-5 sm:px-5">
      <p className="font-heading text-base font-semibold text-orange-950">
        وکیل مورد نظر شما پرونده را نپذیرفت
      </p>
      <p className="mt-2 text-sm leading-7 text-orange-950/80">
        {lastRejectReason ? `دلیل: ${lastRejectReason}. ` : ""}
        می‌توانید وکیل دیگری انتخاب کنید یا از اپراتور بخواهید برایتان انتخاب کند. مبلغ پرداخت‌شده تا تعیین تکلیف
        محفوظ می‌ماند و فوراً به کیف پول برنمی‌گردد.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          value={lawyerSlug}
          onChange={(e) => setLawyerSlug(e.target.value)}
          className="h-11 rounded-xl border border-orange-200 bg-white px-3 text-sm text-navy"
        >
          <option value="">انتخاب وکیل دیگر</option>
          {options.map((lawyer) => (
            <option key={lawyer.slug} value={lawyer.slug}>
              {lawyer.name} — {lawyer.specialty}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !lawyerSlug}
          onClick={() => void submit("chosen")}
          className={cn(buttonVariants(), "h-11 bg-navy text-gold disabled:opacity-60")}
        >
          ارسال به این وکیل
        </button>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => void submit("assign")}
        className={cn(buttonVariants({ variant: "outline" }), "mt-3 h-11 border-orange-300 text-orange-950")}
      >
        اپراتور برایم وکیل انتخاب کند
      </button>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
