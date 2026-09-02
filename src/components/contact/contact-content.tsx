import Link from "next/link";
import {
  Clock3Icon,
  HeadsetIcon,
  LockKeyholeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { site } from "@/lib/site";

const office = { lat: 35.7572, lng: 51.4097 };

const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${office.lng - 0.012}%2C${office.lat - 0.008}%2C${office.lng + 0.012}%2C${office.lat + 0.008}&layer=mapnik&marker=${office.lat}%2C${office.lng}`;
const osmLink = `https://www.openstreetmap.org/?mlat=${office.lat}&mlon=${office.lng}#map=16/${office.lat}/${office.lng}`;

const info = [
  {
    title: "تلفن",
    value: site.phone,
    href: `tel:${site.phoneRaw}`,
    hint: site.hours,
    icon: PhoneIcon,
  },
  {
    title: "ایمیل",
    value: site.email,
    href: `mailto:${site.email}`,
    hint: "پیام‌های اداری در ساعات کاری پاسخ داده می‌شود.",
    icon: MailIcon,
  },
  {
    title: "نشانی",
    value: site.address,
    hint: "نزدیک میدان ونک",
    icon: MapPinIcon,
  },
] as const;

const features = [
  {
    title: "پاسخگویی سریع",
    text: "پیام‌ها در ساعات کاری بررسی و در اسرع وقت پاسخ داده می‌شود.",
    icon: HeadsetIcon,
  },
  {
    title: "مشاوره تخصصی",
    text: "موضوع حقوقی را به مسیر مشاوره بسپارید تا به کارشناس همان حوزه برسد.",
    icon: ShieldCheckIcon,
  },
  {
    title: "محرمانگی اطلاعات",
    text: "جزئیات پرونده و اسناد را در پیام عمومی ننویسید؛ از مشاوره آنلاین استفاده کنید.",
    icon: LockKeyholeIcon,
  },
  {
    title: "دسترسی منظم",
    text: site.hours,
    icon: Clock3Icon,
  },
];

export function ContactContent() {
  return (
    <section className="relative z-10 bg-paper pb-16 pt-10 sm:pt-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-navy/8 sm:p-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <span className="mb-3 block h-1 w-10 rounded-full bg-gold" />
            <h2 className="font-heading text-2xl font-bold text-navy">فرم تماس</h2>
            <p className="mt-2 mb-6 text-sm leading-7 text-navy/65">
              برای هماهنگی اداری این فرم را پر کنید. موضوع حقوقی را از{" "}
              <Link href="/consult" className="font-medium text-navy underline decoration-gold/70 underline-offset-4">
                مشاوره آنلاین
              </Link>{" "}
              ارسال کنید.
            </p>
            <ContactForm />
          </div>

          <div className="lg:border-s lg:border-navy/8 lg:ps-10">
            <span className="mb-3 block h-1 w-10 rounded-full bg-gold" />
            <h2 className="font-heading text-2xl font-bold text-navy">اطلاعات تماس</h2>
            <ul className="mt-6 space-y-5">
              {info.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy text-gold">
                    <item.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-navy/50">{item.title}</p>
                    {"href" in item && item.href ? (
                      <a
                        href={item.href}
                        dir="ltr"
                        className="mt-0.5 inline-block max-w-full truncate font-medium text-navy hover:text-gold-deep"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-0.5 font-medium text-navy">{item.value}</p>
                    )}
                    <p className="mt-0.5 text-sm leading-6 text-navy/60">{item.hint}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-navy/10">
              <iframe
                title="موقعیت دفتر روی نقشه"
                src={osmEmbed}
                className="h-56 w-full border-0 grayscale-[20%]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={osmLink}
                target="_blank"
                rel="noreferrer"
                className="block bg-paper px-4 py-2.5 text-center text-sm text-navy/70 hover:text-navy"
              >
                باز کردن نقشه در تب جدید
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <div key={item.title} className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-navy/20 text-navy">
                <item.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-heading font-semibold text-navy">{item.title}</h3>
                <p className="mt-1 text-sm leading-7 text-navy/65">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
