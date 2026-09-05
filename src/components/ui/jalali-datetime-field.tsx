"use client";

import { useMemo } from "react";

import { SiteSelect } from "@/components/ui/site-select";
import { toFaDigits } from "@/lib/format";
import {
  dateToJalaliParts,
  jalaliMonthLength,
  jalaliMonthNames,
  jalaliPartsToDate,
  parseDateTimeLocalValue,
  toDateTimeLocalValue,
  type JalaliParts,
} from "@/lib/jalali";
import { cn } from "@/lib/utils";

function rangeOptions(from: number, to: number, label?: (n: number) => string) {
  const options = [];
  for (let value = from; value <= to; value += 1) {
    options.push({
      value: String(value),
      label: label ? label(value) : toFaDigits(value),
    });
  }
  return options;
}

function clampDay(parts: JalaliParts): JalaliParts {
  const max = jalaliMonthLength(parts.year, parts.month);
  return { ...parts, day: Math.min(parts.day, max) };
}

function snapMinute(minute: number) {
  const snapped = Math.round(minute / 15) * 15;
  return snapped === 60 ? 0 : snapped;
}

export function JalaliDateTimeField({
  value,
  onValueChange,
  withTime = true,
  invalid,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  withTime?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const parsed = parseDateTimeLocalValue(value);
  const parts = parsed ? dateToJalaliParts(parsed) : null;
  const fallback = dateToJalaliParts(new Date());

  const year = parts?.year ?? fallback.year;
  const month = parts?.month ?? fallback.month;
  const day = parts?.day ?? fallback.day;
  const hour = parts?.hour ?? 9;
  const minute = snapMinute(parts?.minute ?? 0);

  const yearOptions = useMemo(() => rangeOptions(fallback.year - 2, fallback.year + 6), [fallback.year]);
  const monthOptions = useMemo(
    () => jalaliMonthNames.map((label, index) => ({ value: String(index + 1), label })),
    [],
  );
  const dayOptions = useMemo(
    () => rangeOptions(1, jalaliMonthLength(year, month)),
    [year, month],
  );
  const hourOptions = useMemo(
    () => rangeOptions(0, 23, (n) => toFaDigits(String(n).padStart(2, "0"))),
    [],
  );
  const minuteOptions = useMemo(
    () =>
      [0, 15, 30, 45].map((n) => ({
        value: String(n),
        label: toFaDigits(String(n).padStart(2, "0")),
      })),
    [],
  );

  function emit(next: Partial<JalaliParts>) {
    const merged = clampDay({
      year: next.year ?? year,
      month: next.month ?? month,
      day: next.day ?? day,
      hour: next.hour ?? hour,
      minute: next.minute ?? minute,
    });
    onValueChange(toDateTimeLocalValue(jalaliPartsToDate(merged)));
  }

  return (
    <div className={cn("grid gap-2 sm:grid-cols-3", className)}>
      <SiteSelect
        value={parts ? String(year) : null}
        onValueChange={(next) => emit({ year: Number(next) })}
        options={yearOptions}
        placeholder="سال"
        invalid={invalid}
        className="h-11 w-full min-w-0"
      />
      <SiteSelect
        value={parts ? String(month) : null}
        onValueChange={(next) => emit({ month: Number(next) })}
        options={monthOptions}
        placeholder="ماه"
        invalid={invalid}
        className="h-11 w-full min-w-0"
      />
      <SiteSelect
        value={parts ? String(Math.min(day, jalaliMonthLength(year, month))) : null}
        onValueChange={(next) => emit({ day: Number(next) })}
        options={dayOptions}
        placeholder="روز"
        invalid={invalid}
        className="h-11 w-full min-w-0"
      />
      {withTime ? (
        <>
          <SiteSelect
            value={parts ? String(hour) : null}
            onValueChange={(next) => emit({ hour: Number(next) })}
            options={hourOptions}
            placeholder="ساعت"
            invalid={invalid}
            className="h-11 w-full min-w-0"
          />
          <SiteSelect
            value={parts ? String(minute) : null}
            onValueChange={(next) => emit({ minute: Number(next) })}
            options={minuteOptions}
            placeholder="دقیقه"
            invalid={invalid}
            className="h-11 w-full min-w-0"
          />
          {value ? (
            <button
              type="button"
              onClick={() => onValueChange("")}
              className="h-11 rounded-xl border border-navy/12 bg-white px-3 text-sm text-navy/60 transition hover:border-navy/25 hover:text-navy"
            >
              پاک کردن
            </button>
          ) : (
            <div className="hidden sm:block" aria-hidden />
          )}
        </>
      ) : null}
    </div>
  );
}
