import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { DirectionProvider } from "@/components/ui/direction";
import { site } from "@/lib/site";

import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} ${vazirmatn.className} h-full antialiased`}
    >
      <body className="min-h-full bg-paper font-sans text-navy">
        <DirectionProvider direction="rtl">
          <div className="flex min-h-full flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </DirectionProvider>
      </body>
    </html>
  );
}
