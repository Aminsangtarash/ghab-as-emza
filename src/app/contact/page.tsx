import type { Metadata } from "next";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { PageHero } from "@/components/page-hero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباط با قبل از امضا.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="تماس با ما"
        description="برای هماهنگی اداری از این صفحه، و برای موضوع حقوقی از مشاوره آنلاین استفاده کنید."
      />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div className="space-y-4 text-sm leading-7 text-navy/80">
          <p className="flex items-start gap-3">
            <PhoneIcon className="mt-0.5 size-4 text-gold-deep" />
            <a href={`tel:${site.phoneRaw}`} dir="ltr" className="hover:text-gold-deep">
              {site.phone}
            </a>
          </p>
          <p className="flex items-start gap-3">
            <MailIcon className="mt-0.5 size-4 text-gold-deep" />
            <a href={`mailto:${site.email}`} dir="ltr" className="hover:text-gold-deep">
              {site.email}
            </a>
          </p>
          <p className="flex items-start gap-3">
            <MapPinIcon className="mt-0.5 size-4 text-gold-deep" />
            <span>
              {site.address}
              <br />
              {site.hours}
            </span>
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/10">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
