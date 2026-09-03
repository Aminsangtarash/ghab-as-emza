import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";

import { AuthProvider } from "@/components/auth/auth-provider";
import { AppFrame } from "@/components/layout/app-frame";
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
      className={`${vazirmatn.variable} ${vazirmatn.className} antialiased`}
    >
      <body className="min-h-dvh bg-white font-sans text-navy">
        <DirectionProvider direction="rtl">
          <AuthProvider>
            <AppFrame>{children}</AppFrame>
          </AuthProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
