"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOutIcon, MenuIcon, XIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { GoldCanvas, SiteViewport } from "@/components/layout/site-canvas";
import { LawyerAvatar } from "@/components/lawyers/lawyer-avatar";
import { lawyerNav } from "@/lib/account";
import type { Lawyer } from "@/lib/data";
import { initials } from "@/lib/format";
import type { PublicUser } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LawyerShell({
  user,
  lawyer,
  children,
}: {
  user: PublicUser;
  lawyer?: Lawyer;
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
      router.replace(`/login?next=${encodeURIComponent(pathname || "/lawyer")}`);
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
          "fixed inset-y-2.5 start-2.5 z-40 w-[min(19rem,calc(100%-1.25rem))] flex-col rounded-[1.6rem] bg-navy-deep text-white shadow-xl md:inset-y-3 md:start-3 lg:flex lg:w-80",
          menuOpen ? "flex" : "hidden lg:flex",
        )}
      >
        <LawyerSidebar
          user={user}
          lawyer={lawyer}
          pathname={pathname}
          onClose={() => setMenuOpen(false)}
          onLogout={() => void onLogout()}
        />
      </aside>
      {menuOpen && (
        <button
          type="button"
          aria-label="بستن منو"
          className="fixed inset-0 z-30 bg-navy-deep/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex h-full min-w-0 flex-col overflow-hidden lg:ps-[calc(20rem+0.75rem)]">
        <header className="mb-2.5 flex shrink-0 items-center justify-between rounded-[1.4rem] bg-navy-deep px-3 py-2.5 text-white md:px-4 md:py-3 lg:hidden">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl bg-white/10"
            aria-label="باز کردن منو"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon className="size-5" />
          </button>
          <p className="text-sm font-medium">میز وکیل</p>
          {lawyer ? (
            <LawyerAvatar src={lawyer.image} name={lawyer.name} size={40} className="size-10" />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-sm">
              {initials(user.fullName)}
            </span>
          )}
        </header>
        <GoldCanvas className="px-4 pb-7 pt-8 sm:px-6 sm:pb-9 sm:pt-10 md:px-8 lg:px-10 lg:pt-12">
          <div className="mx-auto min-w-0 max-w-6xl">{children}</div>
        </GoldCanvas>
      </div>
    </SiteViewport>
  );
}

function LawyerSidebar({
  user,
  lawyer,
  pathname,
  onClose,
  onLogout,
}: {
  user: PublicUser;
  lawyer?: Lawyer;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="border-b border-white/10 px-6 pb-5 pt-6">
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-medium tracking-[0.18em] text-white/40">قبل از امضا</p>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md bg-white/10 lg:hidden"
            aria-label="بستن منو"
            onClick={onClose}
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="mt-5 flex flex-col items-center text-center">
          {lawyer ? (
            <LawyerAvatar
              src={lawyer.image}
              name={lawyer.name}
              size={160}
              className="size-24 ring-[3px] ring-white/15"
            />
          ) : (
            <span className="flex size-24 items-center justify-center rounded-full bg-white/10 font-heading text-2xl">
              {initials(user.fullName)}
            </span>
          )}
          <h2 className="mt-4 font-heading text-base font-semibold leading-7">{user.fullName}</h2>
          <p className="mt-0.5 text-xs leading-6 text-white/55">{lawyer?.title ?? "وکیل"}</p>
          {lawyer?.specialty ? (
            <p className="mt-2.5 rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70">
              {lawyer.specialty}
            </p>
          ) : null}
        </div>
      </div>

      <nav className="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto px-4 pb-3" aria-label="منوی میز وکیل">
        <ul className="space-y-1">
          {lawyerNav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
                    active ? "bg-white/10 font-medium text-white" : "text-white/55 hover:bg-white/5 hover:text-white",
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

      <div className="border-t border-white/10 p-4">
        <Link href="/" className="block rounded-md px-3 py-2 text-sm text-white/45 hover:bg-white/5 hover:text-white">
          بازگشت به سایت
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/45 hover:bg-white/5 hover:text-white"
        >
          <LogOutIcon className="size-4" />
          خروج
        </button>
      </div>
    </>
  );
}
