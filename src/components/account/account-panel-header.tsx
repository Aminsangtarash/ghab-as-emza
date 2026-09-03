"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BellIcon, MessageCircleIcon, SearchIcon, WalletIcon } from "lucide-react";

import { accountBreadcrumb } from "@/lib/account";
import { cn } from "@/lib/utils";

export function AccountPanelHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = accountBreadcrumb(pathname);
  const [query, setQuery] = useState("");

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/account/lawyers?q=${encodeURIComponent(q)}` : "/account/lawyers");
  }

  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 lg:mb-10 lg:flex-row lg:items-center lg:gap-4">
      <nav aria-label="مسیر صفحه" className="min-w-0 lg:max-w-[38%]">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-navy/45 sm:text-sm">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1">
                {index > 0 ? <span className="text-navy/25">/</span> : null}
                {last ? (
                  <span className="font-medium text-navy">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-navy">
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <form onSubmit={onSearch} className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-navy/35" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجوی وکیل یا تخصص..."
          className="h-11 w-full rounded-2xl border border-navy/10 bg-paper pr-11 pl-4 text-sm text-navy outline-none placeholder:text-navy/40 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
        />
      </form>

      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        <HeaderIcon href="/account" label="اعلان‌ها">
          <BellIcon className="size-4" />
        </HeaderIcon>
        <HeaderIcon href="/account/chats" label="گفتگوها">
          <MessageCircleIcon className="size-4" />
        </HeaderIcon>
        <Link
          href="/account/wallet"
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-2xl bg-navy px-3.5 text-sm font-medium text-white transition hover:bg-navy-mid",
            pathname === "/account/wallet" && "ring-2 ring-gold/70",
          )}
        >
          <WalletIcon className="size-4 text-gold" />
          کیف پول
        </Link>
      </div>
    </div>
  );
}

function HeaderIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-2xl border border-navy/10 bg-white text-navy/70 transition hover:border-gold/40 hover:text-navy"
    >
      {children}
    </Link>
  );
}
