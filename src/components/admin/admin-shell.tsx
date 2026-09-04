"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOutIcon, MenuIcon, ShieldIcon, XIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { GoldCanvas, SiteViewport } from "@/components/layout/site-canvas";
import { adminNavForRole, panelLabel } from "@/lib/account";
import { initials } from "@/lib/format";
import type { PublicUser } from "@/lib/store-types";
import { cn } from "@/lib/utils";

export function AdminShell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = panelLabel(user.role);
  const nav = adminNavForRole(user.role);

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
      router.replace(`/login?next=${encodeURIComponent(pathname || "/admin")}`);
    }
  }, [pathname, router, status]);

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <SiteViewport>
      <aside
        className={cn(
          "fixed inset-y-2.5 start-2.5 z-40 w-[min(18.5rem,calc(100%-1.25rem))] flex-col overflow-hidden rounded-[1.6rem] border border-navy-deep/10 bg-gradient-to-b from-gold via-gold to-[#c9a227] text-navy-deep shadow-[0_20px_50px_-24px_rgba(20,30,60,0.55)] md:inset-y-3 md:start-3 lg:flex lg:w-72",
          menuOpen ? "flex" : "hidden lg:flex",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)]" />
        <AdminSidebar
          user={user}
          pathname={pathname}
          nav={nav}
          onClose={() => setMenuOpen(false)}
          onLogout={() => void onLogout()}
        />
      </aside>
      {menuOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          className="fixed inset-0 z-30 bg-navy-deep/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex h-full min-w-0 flex-col overflow-hidden lg:ps-[calc(18rem+0.75rem)]">
        <header className="mb-2.5 flex shrink-0 items-center justify-between rounded-[1.4rem] border border-navy-deep/10 bg-gradient-to-l from-gold to-[#d4af37] px-3 py-2.5 text-navy-deep shadow-sm md:px-4 md:py-3 lg:hidden">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl bg-navy/10"
            aria-label="باز کردن منو"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon className="size-5" />
          </button>
          <p className="text-sm font-semibold">{title}</p>
          <span className="flex size-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-gold">
            {initials(user.fullName)}
          </span>
        </header>
        <GoldCanvas tone="navy" className="px-5 pb-8 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pt-12">
          <div className="mx-auto max-w-5xl">{children}</div>
        </GoldCanvas>
      </div>
    </SiteViewport>
  );
}

function AdminSidebar({
  user,
  pathname,
  nav,
  onClose,
  onLogout,
}: {
  user: PublicUser;
  pathname: string;
  nav: ReturnType<typeof adminNavForRole>;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="px-5 pt-7">
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-navy/55">قبل از امضا</p>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md bg-navy/10 lg:hidden"
            aria-label="بستن منو"
            onClick={onClose}
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="mt-6 rounded-2xl bg-navy px-4 py-4 text-white shadow-lg shadow-navy/20">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gold text-navy-deep">
            <ShieldIcon className="size-5" />
          </span>
          <p className="mt-3 text-xs font-medium text-gold">
            {user.role === "manager" ? "مدیر" : "ادمین"}
          </p>
          <p className="mt-1 font-heading text-base font-semibold">{user.fullName}</p>
          <p className="mt-1 text-[11px] text-white/50" dir="ltr">
            {user.phone}
          </p>
        </div>
      </div>

      <nav className="mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-2" aria-label="منوی مدیریت">
        <ul className="space-y-1">
          {nav.map((item) => {
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
                      ? "bg-navy font-medium text-gold shadow-md shadow-navy/15"
                      : "text-navy-deep/80 hover:bg-navy/10 hover:text-navy-deep",
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

      <div className="border-t border-navy/15 bg-navy/[0.04] p-3">
        <Link
          href="/"
          className="block rounded-xl px-3 py-2.5 text-sm text-navy-deep/70 hover:bg-navy/10 hover:text-navy-deep"
        >
          بازگشت به سایت
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-navy-deep/70 hover:bg-navy/10 hover:text-navy-deep"
        >
          <LogOutIcon className="size-4" />
          خروج
        </button>
      </div>
    </div>
  );
}
