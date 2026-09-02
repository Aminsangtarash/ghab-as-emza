import type { Metadata } from "next";

import { AboutContent } from "@/components/about/about-content";
import { AboutHero } from "@/components/about/about-hero";

export const metadata: Metadata = {
  title: "درباره ما",
  description: "ماموریت قبل از امضا: تصمیم حقوقی آگاهانه، با امنیت و کیفیت.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutContent />
    </>
  );
}
