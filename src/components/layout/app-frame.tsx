"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isPanelPath } from "@/lib/account";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isPanelPath(pathname)) {
    return children;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
