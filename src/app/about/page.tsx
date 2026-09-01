import type { Metadata } from "next";
import { LockKeyholeIcon, ScaleIcon, ShieldCheckIcon } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "درباره ما",
  description: "ماموریت قبل از امضا: تصمیم حقوقی آگاهانه، با امنیت و کیفیت.",
};

const values = [
  {
    title: "امنیت اطلاعات",
    text: "حداقل داده، دسترسی محدود، و مسیر رسمی به‌جای پیام‌رسان عمومی.",
    icon: LockKeyholeIcon,
  },
  {
    title: "کیفیت کارشناسی",
    text: "هر پاسخ باید قابل استناد باشد؛ نه کلی‌گویی و نه وعده نتیجه قطعی دادگاه.",
    icon: ScaleIcon,
  },
  {
    title: "مسئولیت حرفه‌ای",
    text: "محدوده خدمت، مرحله بعد و مسئولیت پیگیری از همان ابتدا شفاف است.",
    icon: ShieldCheckIcon,
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero title="درباره ما" description={site.description} />
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm leading-8 text-navy/80 sm:text-base">
          {site.name} برای لحظه‌ای ساخته شده که هنوز فرصت اصلاح دارید: قبل از امضا، قبل از طرح دعوا، قبل از ارسال مدرک. ما مشاوره و خدمات حقوقی را طوری طراحی کرده‌ایم که هم کیفیت کارشناسی حفظ شود و هم اطلاعات شما در مسیری کنترل‌شده بماند.
        </p>
        <div className="mt-10 grid gap-4">
          {values.map((item) => (
            <div key={item.title} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-navy/10">
              <item.icon className="mt-0.5 size-6 shrink-0 text-gold-deep" />
              <div>
                <h2 className="font-heading font-semibold text-navy">{item.title}</h2>
                <p className="mt-1 text-sm leading-7 text-navy/70">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
