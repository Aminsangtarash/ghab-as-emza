"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOutIcon, MenuIcon, XIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { accountNav } from "@/lib/account";
import { initials, toFaDigits } from "@/lib/format";
import type { PublicUser } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AccountShell({
  user,
  children,
}: {
  user: PublicUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (status === "guest") {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/account")}`);
    }
  }, [pathname, router, status]);

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <div className="min-h-dvh bg-paper p-2.5 lg:p-3">
      <aside
        className={cn(
          "fixed inset-y-2.5 start-2.5 z-40 w-[min(18.5rem,calc(100%-1.25rem))] flex-col rounded-[1.6rem] bg-navy text-white shadow-xl lg:inset-y-3 lg:start-3 lg:flex lg:w-72",
          menuOpen ? "flex" : "hidden lg:flex",
        )}
      >
        <SidebarBody
          user={user}
          pathname={pathname}
          onClose={() => setMenuOpen(false)}
          onLogout={() => void onLogout()}
        />
      </aside>
      {menuOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          className="fixed inset-0 z-30 bg-navy-deep/45 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex min-h-[calc(100dvh-1.25rem)] flex-col lg:min-h-[calc(100dvh-1.5rem)] lg:ps-[calc(18rem+0.75rem)]">
        <header className="mb-2.5 flex items-center justify-between rounded-[1.4rem] bg-navy px-3 py-2.5 text-white lg:hidden">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl bg-white/10"
            aria-label="باز کردن منو"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon className="size-5" />
          </button>
          <p className="font-heading text-sm font-semibold">پنل کاربری</p>
          <span className="flex size-10 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy-deep">
            {initials(user.fullName)}
          </span>
        </header>
        <div className="flex-1 overflow-auto rounded-[1.6rem] bg-white px-5 pb-6 pt-8 shadow-sm ring-1 ring-navy/8 sm:px-8 sm:pt-10 sm:pb-8 lg:px-10 lg:pt-12">
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarBody({
  user,
  pathname,
  onClose,
  onLogout,
}: {
  user: PublicUser;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium tracking-wide text-gold">قبل از امضا</p>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white lg:hidden"
            aria-label="بستن منو"
            onClick={onClose}
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="mt-4 rounded-2xl bg-navy-mid/80 p-3 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold font-heading text-lg font-bold text-navy-deep">
              {initials(user.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold">{user.fullName}</p>
              <p className="mt-0.5 truncate text-xs text-white/60" dir="ltr">
                {toFaDigits(user.phone)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-3" aria-label="منوی پنل">
        <ul className="space-y-1">
          {accountNav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-gold/15 font-medium text-gold"
                      : "text-white/75 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white"
        >
          بازگشت به سایت
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white"
        >
          <LogOutIcon className="size-4" />
          خروج
        </button>
      </div>
    </>
  );
}
