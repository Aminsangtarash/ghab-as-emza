import Link from "next/link";
import { Clock3Icon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { Logo } from "@/components/logo";
import { navItems, site } from "@/lib/site";
import { services } from "@/lib/data";

function EnamadBadge() {
  return (
    <div className="flex w-28 flex-col items-center rounded-lg border border-emerald-700/20 bg-white p-2 text-center shadow-sm">
      <svg viewBox="0 0 64 64" className="size-12" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#0F6B4C" />
        <path
          d="M20 33.5 28 41l16-20"
          fill="none"
          stroke="#F4E8C1"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mt-1 text-[10px] font-bold text-navy">نماد اعتماد الکترونیک</p>
      <p className="text-[10px] text-gold">★★★★★</p>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto bg-navy-deep text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="text-white [&_span:last-child]:text-white/70" />
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/75">
            {site.description}
          </p>
          <div className="mt-5 flex gap-2">
            <a
              href={site.social.instagram}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
              rel="noreferrer"
              target="_blank"
            >
              اینستاگرام
            </a>
            <a
              href={site.social.linkedin}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
              rel="noreferrer"
              target="_blank"
            >
              لینکدین
            </a>
            <a
              href={site.social.telegram}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
              rel="noreferrer"
              target="_blank"
            >
              تلگرام
            </a>
          </div>
        </div>
        <div>
          <h2 className="font-heading text-base font-semibold">دسترسی سریع</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-heading text-base font-semibold">خدمات</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {services.map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`} className="hover:text-gold">
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-heading text-base font-semibold">تماس با ما</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li className="flex items-start gap-2">
              <PhoneIcon className="mt-0.5 size-4 shrink-0 text-gold" />
              <a href={`tel:${site.phoneRaw}`} className="hover:text-gold" dir="ltr">
                {site.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MailIcon className="mt-0.5 size-4 shrink-0 text-gold" />
              <a href={`mailto:${site.email}`} className="hover:text-gold" dir="ltr">
                {site.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>{site.address}</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock3Icon className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>{site.hours}</span>
            </li>
          </ul>
          <div className="mt-5">
            <EnamadBadge />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-white/55 sm:px-6">
          © ۱۴۰۵ {site.name} — تمامی حقوق محفوظ است. اطلاعات حقوقی محرمانه تلقی می‌شود.
        </p>
      </div>
    </footer>
  );
}
