"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { PanelMobileDrawer } from "@/components/layout/panel-mobile-drawer";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { panelHome, panelLabel } from "@/lib/account";
import { navItems } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="منوی اصلی">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-navy after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-gold"
                    : "text-navy/70 hover:text-navy",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          {status === "user" && user ? (
            <>
              <Link
                href={panelHome(user.role)}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "hidden h-10 bg-navy px-4 text-white hover:bg-navy-mid sm:inline-flex",
                )}
              >
                {panelLabel(user.role)}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "hidden h-10 border-navy/20 px-4 sm:inline-flex",
                )}
              >
                خروج
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "hidden h-10 bg-navy px-4 text-white hover:bg-navy-mid sm:inline-flex",
              )}
            >
              ورود / ثبت نام
            </Link>
          )}
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "border-navy/20 lg:hidden",
            )}
            aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <PanelMobileDrawer
        open={menuOpen}
        onClose={closeMenu}
        hideFromClassName="lg:hidden"
        className="border-s border-navy/8 bg-white text-navy"
        widthClassName="w-[min(19rem,86vw)]"
        ariaLabel="منوی سایت"
      >
        <div className="flex items-start justify-between gap-3 border-b border-navy/8 px-5 pb-4 pt-5">
          <div className="min-w-0">
            <Logo />
            <p className="mt-1.5 text-xs text-navy/45">منوی سایت</p>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-navy/10 bg-navy/[0.03] text-navy/70 transition hover:bg-navy/[0.06] hover:text-navy"
            aria-label="بستن منو"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="منوی موبایل">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-navy text-white shadow-sm shadow-navy/15"
                        : "text-navy/75 hover:bg-navy/[0.05] hover:text-navy",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto space-y-2 border-t border-navy/8 px-4 py-4">
          {status === "user" && user ? (
            <>
              <Link
                href={panelHome(user.role)}
                onClick={closeMenu}
                className={cn(
                  buttonVariants(),
                  "h-11 w-full bg-navy text-white hover:bg-navy-mid",
                )}
              >
                {panelLabel(user.role)}
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  void logout();
                }}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 w-full border-navy/15",
                )}
              >
                خروج
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={closeMenu}
              className={cn(
                buttonVariants(),
                "h-11 w-full bg-navy text-white hover:bg-navy-mid",
              )}
            >
              ورود / ثبت نام
            </Link>
          )}
        </div>
      </PanelMobileDrawer>
    </header>
  );
}
