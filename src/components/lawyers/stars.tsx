"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

function StarIcon({
  filled,
  half,
  className,
}: {
  filled: boolean;
  half?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M10 1.8 12.5 7l5.8.8-4.2 4.1 1 5.8L10 15.4 4.9 18.7l1-5.8L1.7 7.8 7.5 7 10 1.8Z"
        fill={filled || half ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.2"
        opacity={filled ? 1 : half ? 0.55 : 0.28}
      />
    </svg>
  );
}

function Stars({ rating, className, size = "sm" }: { rating: number; className?: string; size?: "sm" | "md" }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-gold", className)}
      aria-label={`${rating} از ۵`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = rating >= index + 1;
        const half = !filled && rating >= index + 0.5;
        return (
          <StarIcon
            key={index}
            filled={filled}
            half={half}
            className={size === "md" ? "size-5" : "size-3.5"}
          />
        );
      })}
    </span>
  );
}

const scoreLabels = ["خیلی ضعیف", "ضعیف", "متوسط", "خوب", "عالی"] as const;

function StarRatingInput({
  value,
  onChange,
  disabled,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const groupId = useId();
  const [hover, setHover] = useState(0);
  const active = hover || value;
  const label = active >= 1 && active <= 5 ? scoreLabels[active - 1] : "امتیاز خود را انتخاب کنید";

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="flex items-center justify-center gap-1.5 sm:gap-2"
        role="radiogroup"
        aria-label="امتیاز از ۱ تا ۵"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((score) => {
          const selected = active >= score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={value === score}
              aria-label={`${score} ستاره — ${scoreLabels[score - 1]}`}
              disabled={disabled}
              id={`${groupId}-${score}`}
              onMouseEnter={() => setHover(score)}
              onFocus={() => setHover(score)}
              onBlur={() => setHover(0)}
              onClick={() => onChange(score)}
              className={cn(
                "rounded-xl p-1.5 transition duration-150 outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selected ? "scale-105 text-gold" : "text-navy/20 hover:text-gold/70",
              )}
            >
              <StarIcon filled={selected} className="size-9 sm:size-10" />
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm font-medium text-navy/70">{label}</p>
    </div>
  );
}

export { Stars, StarRatingInput, StarIcon };
