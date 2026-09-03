"use client";

import { usePathname } from "next/navigation";

import { GoldCanvas, SiteViewport } from "@/components/layout/site-canvas";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isPanelPath } from "@/lib/account";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isPanelPath(pathname)) {
    return children;
  }

  return (
    <SiteViewport>
      <GoldCanvas fill className="flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </GoldCanvas>
    </SiteViewport>
  );
}
