"use client";

import { useEffect, useId, useRef } from "react";

import { OTP_LENGTH } from "@/lib/otp-constants";
import { cn } from "@/lib/utils";

function toLatinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function onlyDigits(value: string) {
  return toLatinDigits(value).replace(/\D/g, "");
}

export function OtpInput({
  value,
  onChange,
  length = OTP_LENGTH,
  disabled,
  autoFocus,
  className,
  "aria-invalid": ariaInvalid,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
}) {
  const baseId = useId();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  useEffect(() => {
    if (!autoFocus) return;
    inputsRef.current[0]?.focus();
  }, [autoFocus]);

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  }

  function focusAt(index: number) {
    const el = inputsRef.current[Math.max(0, Math.min(length - 1, index))];
    el?.focus();
    el?.select();
  }

  function handlePaste(raw: string) {
    const pasted = onlyDigits(raw).slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  }

  return (
    <div
      className={cn("flex dir-ltr justify-center gap-2 sm:gap-2.5", className)}
      dir="ltr"
      role="group"
      aria-label="کد تأیید پنج رقمی"
    >
      {digits.map((digit, index) => (
        <input
          key={`${baseId}-${index}`}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          id={`${baseId}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-label={`رقم ${index + 1} از ${length}`}
          className={cn(
            "h-12 w-11 rounded-xl border border-navy/15 bg-navy/[0.02] text-center font-heading text-xl font-semibold text-navy shadow-sm outline-none transition",
            "appearance-none [-moz-appearance:textfield]",
            "focus:border-gold focus:bg-white focus:ring-4 focus:ring-gold/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "sm:h-14 sm:w-12 sm:text-2xl",
            ariaInvalid && "border-red-400 ring-3 ring-red-200/60",
          )}
          onChange={(event) => {
            const next = onlyDigits(event.target.value);
            if (!next) {
              setDigit(index, "");
              return;
            }
            if (next.length > 1) {
              handlePaste(next);
              return;
            }
            setDigit(index, next);
            if (index < length - 1) focusAt(index + 1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              if (digits[index]) {
                setDigit(index, "");
              } else if (index > 0) {
                setDigit(index - 1, "");
                focusAt(index - 1);
              }
              event.preventDefault();
              return;
            }
            if (event.key === "ArrowLeft") {
              focusAt(index - 1);
              event.preventDefault();
              return;
            }
            if (event.key === "ArrowRight") {
              focusAt(index + 1);
              event.preventDefault();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            handlePaste(event.clipboardData.getData("text"));
          }}
          onFocus={(event) => event.currentTarget.select()}
        />
      ))}
    </div>
  );
}
