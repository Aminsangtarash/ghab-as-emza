"use client";

import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function UnreadBadge({
  count,
  className,
  tone = "gold",
}: {
  count: number;
  className?: string;
  tone?: "gold" | "rose";
}) {
  if (count <= 0) return null;
  const label = count > 99 ? "۹۹+" : toFaDigits(count);
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums",
        tone === "gold" ? "bg-gold text-navy-deep" : "bg-rose-500 text-white",
        className,
      )}
      aria-label={`${label} پیام خوانده‌نشده`}
    >
      {label}
    </span>
  );
}
