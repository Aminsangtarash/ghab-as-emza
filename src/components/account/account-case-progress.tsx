"use client";

import { CheckIcon, XIcon } from "lucide-react";

import {
  buildClientCaseProgress,
  clientCaseProgressSummary,
  type CaseStage,
  type CaseStatus,
  type ClientProgressStep,
} from "@/lib/case-model";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AccountCaseProgress({
  status,
  stage,
}: {
  status: CaseStatus;
  stage: CaseStage;
}) {
  const steps = buildClientCaseProgress({ status, stage });
  const summary = clientCaseProgressSummary(steps);
  const currentIndex = steps.findIndex((step) => step.state === "current");
  const connectorProgress =
    status === "closed"
      ? 1
      : status === "declined"
        ? 0.5
        : currentIndex >= 0
          ? currentIndex / Math.max(steps.length - 1, 1)
          : summary.doneCount / Math.max(steps.length - 1, 1);

  return (
    <section
      className="rounded-2xl bg-white/85 p-5 shadow-sm ring-1 ring-navy/8 sm:p-6"
      aria-label="روند پیشرفت پرونده"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gold-deep">پیگیری پرونده</p>
          <h2 className="mt-1 font-heading text-lg font-semibold text-navy sm:text-xl">روند پیشرفت</h2>
          <p className="mt-1 text-sm leading-7 text-navy/60">
            نمایش فقط‌خواندنی؛ وضعیت را وکیل به‌روزرسانی می‌کند.
          </p>
        </div>
        <div className="rounded-2xl bg-navy/[0.04] px-4 py-3 text-center">
          <p className="text-[11px] text-navy/45">میزان پیشرفت</p>
          <p className="mt-0.5 font-heading text-lg font-semibold text-navy">
            {toFaDigits(summary.percent)}٪
          </p>
          <p className="text-[11px] text-navy/45">
            {toFaDigits(summary.doneCount)} از {toFaDigits(summary.total)} مرحله
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-navy/8" aria-hidden>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            status === "declined" ? "bg-red-400" : "bg-gradient-to-l from-gold to-navy",
          )}
          style={{ width: `${Math.max(status === "declined" ? 40 : summary.percent, 8)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-navy/65">
        وضعیت فعلی: <span className="font-medium text-navy">{summary.currentTitle}</span>
        {status === "on-hold" ? (
          <span className="mr-2 inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800">
            معلق
          </span>
        ) : null}
      </p>

      <ol className="mt-6 hidden md:block">
        <li className="relative">
          <div className="absolute top-4 right-4 left-4 h-0.5 bg-navy/10" aria-hidden />
          <div
            className={cn(
              "absolute top-4 right-4 h-0.5 transition-all duration-500",
              status === "declined" ? "bg-red-400" : "bg-navy",
            )}
            style={{ width: `calc((100% - 2rem) * ${connectorProgress})` }}
            aria-hidden
          />
          <ul
            className="relative z-[1] grid gap-2"
            style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
          >
            {steps.map((step) => (
              <li key={step.id} className="flex min-w-0 flex-col items-center px-1 text-center">
                <StepBadge step={step} />
                <p
                  className={cn(
                    "mt-3 text-xs font-medium leading-5",
                    step.state === "current" && "text-navy",
                    step.state === "done" && "text-navy/80",
                    step.state === "cancelled" && "text-red-700",
                    step.state === "upcoming" && "text-navy/40",
                  )}
                >
                  {step.title}
                </p>
                {step.state === "current" ? (
                  <span className="mt-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium text-gold-deep">
                    جاری
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </li>
      </ol>

      <ol className="mt-5 space-y-0 md:hidden">
        {steps.map((step, index) => (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute top-8 bottom-0 right-[0.95rem] w-0.5",
                  step.state === "done" ? "bg-navy" : "bg-navy/15",
                )}
              />
            ) : null}
            <div className="relative z-[1] shrink-0">
              <StepBadge step={step} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "current" && "text-navy",
                  step.state === "cancelled" && "text-red-700",
                  step.state === "upcoming" && "text-navy/45",
                  step.state === "done" && "text-navy/80",
                )}
              >
                {step.title}
              </p>
              <p className="mt-1 text-xs leading-6 text-navy/55">{step.hint}</p>
              {step.state === "current" ? (
                <span className="mt-2 inline-flex rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-gold-deep">
                  مرحله جاری
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StepBadge({ step }: { step: ClientProgressStep }) {
  if (step.state === "done") {
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-navy text-white shadow-sm">
        <CheckIcon className="size-4" aria-hidden />
        <span className="sr-only">انجام‌شده</span>
      </span>
    );
  }
  if (step.state === "cancelled") {
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
        <XIcon className="size-4" aria-hidden />
        <span className="sr-only">لغو شده</span>
      </span>
    );
  }
  if (step.state === "current") {
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-gold text-navy-deep shadow-sm ring-4 ring-gold/30">
        <span className="size-2.5 rounded-full bg-navy-deep" aria-hidden />
        <span className="sr-only">جاری</span>
      </span>
    );
  }
  return (
    <span className="flex size-8 items-center justify-center rounded-full border-2 border-navy/15 bg-white">
      <span className="size-2 rounded-full bg-navy/20" aria-hidden />
      <span className="sr-only">آینده</span>
    </span>
  );
}
