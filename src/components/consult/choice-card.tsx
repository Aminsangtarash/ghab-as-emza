import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ChoiceCard({
  selected,
  title,
  hint,
  badge,
  icon,
  onSelect,
  invalid = false,
  className,
}: {
  selected: boolean;
  title: string;
  hint?: string;
  badge?: string;
  icon?: ReactNode;
  onSelect: () => void;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex h-full w-full flex-col rounded-2xl border p-5 text-start transition duration-200",
        selected
          ? "border-gold bg-gold/8 shadow-sm ring-1 ring-gold/25"
          : invalid
            ? "border-red-500 bg-red-50 hover:border-red-600"
            : "border-navy/10 bg-white hover:border-navy/25 hover:bg-paper/60",
        className,
      )}
    >
      <span className="flex items-start justify-between gap-3">
        {icon ? (
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              selected ? "bg-navy text-gold" : "bg-navy/6 text-navy",
            )}
          >
            {icon}
          </span>
        ) : null}
        {badge ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium",
              selected ? "bg-navy text-gold" : "bg-paper text-navy/60",
            )}
          >
            {badge}
          </span>
        ) : null}
      </span>
      <span className="mt-4 font-heading text-base font-semibold text-navy">{title}</span>
      {hint ? <span className="mt-2 text-sm leading-7 text-navy/65">{hint}</span> : null}
    </button>
  );
}
