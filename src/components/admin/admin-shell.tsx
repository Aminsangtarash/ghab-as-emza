"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOutIcon, MenuIcon, ShieldIcon, XIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { PanelMobileDrawer } from "@/components/layout/panel-mobile-drawer";
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
      <aside className="fixed inset-y-3 start-3 z-40 hidden w-80 flex-col overflow-hidden rounded-[1.6rem] bg-gold text-navy-deep shadow-xl lg:flex">
        <AdminSidebar
          user={user}
          pathname={pathname}
          nav={nav}
          onClose={() => setMenuOpen(false)}
          onLogout={() => void onLogout()}
          mobile={false}
        />
      </aside>

      <PanelMobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        hideFromClassName="lg:hidden"
        className="bg-gold text-navy-deep"
      >
        <AdminSidebar
          user={user}
          pathname={pathname}
          nav={nav}
          onClose={() => setMenuOpen(false)}
          onLogout={() => void onLogout()}
          mobile
        />
      </PanelMobileDrawer>

      <div className="flex h-full min-w-0 flex-col overflow-hidden lg:ps-[calc(20rem+0.75rem)]">
        <header className="mb-2.5 flex shrink-0 items-center justify-between rounded-[1.4rem] bg-gold px-3 py-2.5 text-navy-deep md:px-4 md:py-3 lg:hidden">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl bg-navy/10"
            aria-label="باز کردن منو"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon className="size-5" />
          </button>
          <p className="text-sm font-medium">{title}</p>
          <span className="flex size-10 items-center justify-center rounded-full bg-navy-deep text-sm font-bold text-gold">
            {initials(user.fullName)}
          </span>
        </header>
        <GoldCanvas
          tone="navy"
          className="px-4 pb-7 pt-8 sm:px-6 sm:pb-9 sm:pt-10 md:px-8 lg:px-10 lg:pt-12"
        >
          <div className="mx-auto min-w-0 max-w-6xl">{children}</div>
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
  mobile,
}: {
  user: PublicUser;
  pathname: string;
  nav: ReturnType<typeof adminNavForRole>;
  onClose: () => void;
  onLogout: () => void;
  mobile: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("border-b border-navy/10", mobile ? "px-5 pb-4 pt-5" : "px-6 pb-5 pt-6")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium tracking-[0.18em] text-navy/45">قبل از امضا</p>
            {mobile ? <p className="mt-1 text-xs text-navy/50">منوی مدیریت</p> : null}
          </div>
          {mobile ? (
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-xl bg-navy/10 text-navy-deep transition hover:bg-navy/15"
              aria-label="بستن منو"
              onClick={onClose}
            >
              <XIcon className="size-4" />
            </button>
          ) : null}
        </div>

        <div className={cn("flex flex-col items-center text-center", mobile ? "mt-4" : "mt-5")}>
          <span
            className={cn(
              "flex items-center justify-center rounded-full bg-navy-deep text-gold ring-[3px] ring-navy/15",
              mobile ? "size-20" : "size-24",
            )}
          >
            <ShieldIcon className={mobile ? "size-8" : "size-9"} />
          </span>
          <p className="mt-3 rounded-full border border-navy/20 bg-navy/5 px-3 py-1 text-[11px] font-medium text-navy">
            {user.role === "manager" ? "مدیر سیستم" : "ادمین"}
          </p>
          <h2 className="mt-2 font-heading text-base font-semibold leading-7 text-navy-deep">{user.fullName}</h2>
          <p className="mt-0.5 text-xs leading-6 text-navy/55" dir="ltr">
            {user.phone}
          </p>
        </div>
      </div>

      <nav className="no-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto px-4 pb-3" aria-label="منوی مدیریت">
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
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-navy-deep font-medium text-gold"
                      : "text-navy/65 hover:bg-navy/8 hover:text-navy-deep",
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

      <div className="border-t border-navy/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Link
          href="/"
          onClick={onClose}
          className="block rounded-xl px-3 py-2 text-sm text-navy/50 hover:bg-navy/8 hover:text-navy-deep"
        >
          بازگشت به سایت
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-navy/50 hover:bg-navy/8 hover:text-navy-deep"
        >
          <LogOutIcon className="size-4" />
          خروج
        </button>
      </div>
    </div>
  );
}
