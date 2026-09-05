"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOutIcon, MenuIcon, XIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { ChatNotificationsProvider, useChatNotifications } from "@/components/chat/chat-notifications-provider";
import { UnreadBadge } from "@/components/chat/unread-badge";
import { PanelMobileDrawer } from "@/components/layout/panel-mobile-drawer";
import { GoldCanvas, SiteViewport } from "@/components/layout/site-canvas";
import { LawyerAvatar } from "@/components/lawyers/lawyer-avatar";
import { lawyerNav } from "@/lib/account";
import type { Lawyer } from "@/lib/data";
import { initials } from "@/lib/format";
import type { PublicUser } from "@/lib/store-types";
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
    <ChatNotificationsProvider>
      <SiteViewport>
        <aside className="fixed inset-y-3 start-3 z-40 hidden w-80 flex-col rounded-[1.6rem] bg-navy-deep text-white shadow-xl lg:flex">
          <LawyerSidebar
            user={user}
            lawyer={lawyer}
            pathname={pathname}
            onClose={() => setMenuOpen(false)}
            onLogout={() => void onLogout()}
            mobile={false}
          />
        </aside>

        <PanelMobileDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          hideFromClassName="lg:hidden"
          className="bg-navy-deep text-white"
        >
          <LawyerSidebar
            user={user}
            lawyer={lawyer}
            pathname={pathname}
            onClose={() => setMenuOpen(false)}
            onLogout={() => void onLogout()}
            mobile
          />
        </PanelMobileDrawer>

        <div className="flex h-full min-w-0 flex-col overflow-hidden lg:ps-[calc(20rem+0.75rem)]">
          <header className="mb-2.5 flex shrink-0 items-center justify-between rounded-[1.4rem] bg-navy-deep px-3 py-2.5 text-white md:px-4 md:py-3 lg:hidden">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-xl bg-white/10"
              aria-label="باز کردن منو"
              aria-expanded={menuOpen}
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
    </ChatNotificationsProvider>
  );
}

function LawyerSidebar({
  user,
  lawyer,
  pathname,
  onClose,
  onLogout,
  mobile,
}: {
  user: PublicUser;
  lawyer?: Lawyer;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
  mobile: boolean;
}) {
  const { unreadTotal } = useChatNotifications();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("border-b border-white/10", mobile ? "px-5 pb-4 pt-5" : "px-6 pb-5 pt-6")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium tracking-[0.18em] text-white/40">قبل از امضا</p>
            {mobile ? <p className="mt-1 text-xs text-white/45">منوی میز وکیل</p> : null}
          </div>
          {mobile ? (
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15"
              aria-label="بستن منو"
              onClick={onClose}
            >
              <XIcon className="size-4" />
            </button>
          ) : null}
        </div>
        <div className={cn("flex flex-col items-center text-center", mobile ? "mt-4" : "mt-5")}>
          {lawyer ? (
            <LawyerAvatar
              src={lawyer.image}
              name={lawyer.name}
              size={160}
              className={cn("ring-[3px] ring-white/15", mobile ? "size-20" : "size-24")}
            />
          ) : (
            <span
              className={cn(
                "flex items-center justify-center rounded-full bg-white/10 font-heading",
                mobile ? "size-20 text-xl" : "size-24 text-2xl",
              )}
            >
              {initials(user.fullName)}
            </span>
          )}
          <h2 className="mt-3 font-heading text-base font-semibold leading-7">{user.fullName}</h2>
          <p className="mt-0.5 text-xs leading-6 text-white/55">{lawyer?.title ?? "وکیل"}</p>
          {lawyer?.specialty ? (
            <p className="mt-2 rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70">
              {lawyer.specialty}
            </p>
          ) : null}
        </div>
      </div>

      <nav className="no-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto px-4 pb-3" aria-label="منوی میز وکیل">
        <ul className="space-y-1">
          {lawyerNav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const showBadge = item.href === "/lawyer/chats" && unreadTotal > 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active ? "bg-white/10 font-medium text-white" : "text-white/55 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {showBadge ? <UnreadBadge count={unreadTotal} /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Link
          href="/"
          onClick={onClose}
          className="block rounded-xl px-3 py-2 text-sm text-white/45 hover:bg-white/5 hover:text-white"
        >
          بازگشت به سایت
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/45 hover:bg-white/5 hover:text-white"
        >
          <LogOutIcon className="size-4" />
          خروج
        </button>
      </div>
    </div>
  );
}
