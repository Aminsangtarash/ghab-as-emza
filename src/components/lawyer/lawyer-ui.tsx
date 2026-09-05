import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export const panelCard = "rounded-[1.35rem] border border-navy/10 bg-white text-navy shadow-sm";

export function LawyerHeading({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={cn(panelCard, "flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6 md:flex-row md:items-end md:justify-between")}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gold-deep">{kicker}</p>
        <h1 className="mt-3 font-heading text-2xl font-bold text-navy">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/60">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "bg-navy/8 text-navy",
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className={cn("flex size-10 items-center justify-center rounded-xl", tone)}>
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-xs text-navy/45">{label}</p>
      <p className="mt-1 font-heading text-lg font-bold text-navy">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-navy/40">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(panelCard, "block px-4 py-4 transition hover:border-gold/40 hover:shadow-md")}>
        {inner}
      </Link>
    );
  }
  return <div className={cn(panelCard, "px-4 py-4")}>{inner}</div>;
}

export function SectionCard({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(panelCard, "min-w-0 px-5 py-5 sm:px-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-semibold text-navy">{title}</h2>
          {hint ? <p className="mt-1 text-xs leading-6 text-navy/45">{hint}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Tone({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", tone)}>{children}</span>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-navy/15 bg-paper/60 px-4 py-8 text-center text-sm text-navy/50">
      {children}
    </p>
  );
}

export function FieldLabel({
  children,
  required,
  invalid,
}: {
  children: React.ReactNode;
  required?: boolean;
  invalid?: boolean;
}) {
  return (
    <span
      className={cn(
        "mb-1.5 block text-xs font-medium",
        invalid ? "text-red-700" : "text-navy/60",
      )}
    >
      {children}
      {required ? <span className="mr-1 text-red-600">*</span> : null}
    </span>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-navy/15 bg-white px-3 text-sm text-navy outline-none ring-gold/40 transition focus:ring-2";

export const textareaClass =
  "min-h-24 w-full rounded-xl border border-navy/15 bg-white p-3 text-sm leading-7 text-navy outline-none ring-gold/40 transition focus:ring-2";

export const fieldInvalidClass =
  "border-red-400 bg-red-50/40 ring-2 ring-red-200/80 focus:ring-red-300";

export function controlClass(invalid?: boolean, base: string = inputClass) {
  return cn(base, invalid && fieldInvalidClass);
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs leading-5 text-red-700">{children}</p>;
}
export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
      {children}
    </p>
  );
}

export function OkNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
      {children}
    </p>
  );
}

export function faCount(value: number, unit: string) {
  return `${toFaDigits(value)} ${unit}`;
}

export async function panelFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const response = await fetch(url, {
      credentials: "include",
      ...init,
      headers: init?.body ? { "Content-Type": "application/json", ...(init?.headers ?? {}) } : init?.headers,
    });
    const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
      return { ok: false, error: payload?.error ?? "انجام نشد. دوباره تلاش کنید." };
    }
    return { ok: true, data: payload };
  } catch {
    return { ok: false, error: "ارتباط با سرور برقرار نشد." };
  }
}
