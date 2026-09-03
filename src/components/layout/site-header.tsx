"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
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
    const canvas = document.querySelector<HTMLElement>("[data-site-canvas]");
    if (canvas) {
      canvas.style.overflowY = menuOpen ? "hidden" : "";
    }
    return () => {
      if (canvas) canvas.style.overflowY = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-gold-wash/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="منوی اصلی">
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
      {menuOpen && (
        <div className="border-t border-navy/10 bg-gold-wash lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6" aria-label="منوی موبایل">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-navy/5"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {status === "user" && user ? (
              <>
                <Link
                  href={panelHome(user.role)}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    buttonVariants(),
                    "mt-2 h-10 bg-navy text-white hover:bg-navy-mid",
                  )}
                >
                  {panelLabel(user.role)}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 border-navy/20",
                  )}
                >
                  خروج
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  buttonVariants(),
                  "mt-2 h-10 bg-navy text-white hover:bg-navy-mid",
                )}
              >
                ورود / ثبت نام
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
