"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

export const panelCard = "rounded-[1.35rem] border border-navy/10 bg-white text-navy shadow-sm";

export async function adminFetch<T = unknown>(
  input: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const data = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
      return { ok: false, error: data.error || "خطا در انجام عملیات." };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "ارتباط با سرور برقرار نشد." };
  }
}

export function useAdminRole() {
  const { user } = useAuth();
  return user?.role;
}

export function AdminHeading({
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
    <div
      className={cn(
        panelCard,
        "flex flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6 md:flex-row md:items-end md:justify-between",
      )}
    >
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

export function AdminSectionCard({
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

export function AdminStatTile({
  label,
  value,
  hint,
  href,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: string;
}) {
  const inner = (
    <>
      <p className={cn("text-xs", tone ? "opacity-70" : "text-navy/45")}>{label}</p>
      <p className="mt-2 font-heading text-2xl font-bold text-navy">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-navy/40">{hint}</p> : null}
    </>
  );
  const className = cn(
    panelCard,
    "block px-4 py-4 transition hover:border-gold/40 hover:shadow-md",
    tone,
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function AdminErrorNote({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{children}</p>;
}

export function AdminOkNote({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{children}</p>;
}

export function AdminEmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-navy/15 bg-paper/60 px-4 py-8 text-center text-sm text-navy/50">
      {children}
    </p>
  );
}

export function adminInputClass(invalid?: boolean) {
  return cn(
    "mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-navy/30",
    invalid && "border-red-400 bg-red-50/40",
  );
}

export function AdminIconStat({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "bg-navy/8 text-navy",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  tone?: string;
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
