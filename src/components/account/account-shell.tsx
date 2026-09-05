"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GlobeIcon, LogOutIcon, MenuIcon, WalletIcon, XIcon } from "lucide-react";

import { AccountPanelHeader } from "@/components/account/account-panel-header";
import { UserAvatar } from "@/components/account/user-avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { ChatNotificationsProvider, useChatNotifications } from "@/components/chat/chat-notifications-provider";
import { UnreadBadge } from "@/components/chat/unread-badge";
import { PanelMobileDrawer } from "@/components/layout/panel-mobile-drawer";
import { GoldCanvas, SiteViewport } from "@/components/layout/site-canvas";
import { accountNav } from "@/lib/account";
import { formatToman, toFaDigits } from "@/lib/format";
import type { PublicUser } from "@/lib/store-types";
import { cn } from "@/lib/utils";

export function AccountShell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
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
    <ChatNotificationsProvider>
      <SiteViewport>
        <aside className="fixed inset-y-3 start-3 z-40 hidden w-72 flex-col rounded-[1.6rem] bg-navy text-white shadow-xl xl:flex">
          <SidebarBody
            user={user}
            pathname={pathname}
            onClose={() => setMenuOpen(false)}
            onLogout={() => void onLogout()}
            mobile={false}
          />
        </aside>

        <PanelMobileDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          hideFromClassName="xl:hidden"
          className="bg-navy text-white"
        >
          <SidebarBody
            user={user}
            pathname={pathname}
            onClose={() => setMenuOpen(false)}
            onLogout={() => void onLogout()}
            mobile
          />
        </PanelMobileDrawer>

        <div className="flex h-full min-w-0 flex-col overflow-hidden xl:ps-[calc(18rem+0.75rem)]">
          <header className="mb-2.5 flex shrink-0 items-center justify-between rounded-[1.4rem] bg-navy px-3 py-2.5 text-white md:px-4 md:py-3 xl:hidden">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-xl bg-white/10 md:size-11"
              aria-label="باز کردن منو"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon className="size-5" />
            </button>
            <div className="min-w-0 px-2 text-center">
              <p className="font-heading text-sm font-semibold">پنل کاربری</p>
              <p className="mt-0.5 hidden truncate text-[11px] text-white/55 md:block">{user.fullName}</p>
            </div>
            <Link
              href="/account/wallet"
              aria-label="کیف پول"
              className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-gold md:size-11"
            >
              <WalletIcon className="size-4" />
            </Link>
          </header>
          <GoldCanvas className="px-4 pb-7 pt-8 sm:px-6 sm:pt-10 sm:pb-9 md:px-8 lg:px-10 lg:pt-12">
            <div className="relative mx-auto min-w-0 max-w-6xl">
              <AccountPanelHeader />
              {children}
            </div>
          </GoldCanvas>
        </div>
      </SiteViewport>
    </ChatNotificationsProvider>
  );
}

function SidebarBody({
  user,
  pathname,
  onClose,
  onLogout,
  mobile,
}: {
  user: PublicUser;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
  mobile: boolean;
}) {
  const { unreadTotal } = useChatNotifications();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("px-4", mobile ? "pt-5 pb-1" : "pt-5")}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-gold">قبل از امضا</p>
            {mobile ? <p className="mt-0.5 text-xs text-white/45">منوی پنل کاربری</p> : null}
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
        <div className="mt-4 rounded-2xl bg-navy-mid/80 p-3 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="md" className="ring-2 ring-white/15" />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold">{user.fullName}</p>
              <p className="mt-0.5 truncate text-xs text-white/60">{toFaDigits(user.phone)}</p>
              <Link
                href="/account/wallet"
                onClick={onClose}
                className="mt-2 inline-block text-[11px] text-gold hover:underline"
              >
                {formatToman(user.walletBalance)}
              </Link>
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
            const showBadge = item.href === "/account/chats" && unreadTotal > 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-white/10 font-medium text-gold"
                      : "text-white/75 hover:bg-white/8 hover:text-white",
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

      <div className="space-y-1 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white"
        >
          <GlobeIcon className="size-4" />
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
    </div>
  );
}
