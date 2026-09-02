import type { Metadata } from "next";

import { ContactContent } from "@/components/contact/contact-content";
import { ContactHero } from "@/components/contact/contact-hero";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباط اداری با قبل از امضا؛ موضوع حقوقی را از مشاوره آنلاین پیگیری کنید.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactContent />
    </>
  );
}
