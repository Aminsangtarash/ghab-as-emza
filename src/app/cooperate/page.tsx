import type { Metadata } from "next";
import Link from "next/link";

import { CooperateForm } from "@/components/cooperate/cooperate-form";
import { CooperateHero } from "@/components/cooperate/cooperate-hero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "همکاری با وکلا",
  description: "ثبت درخواست همکاری وکلا با پلتفرم قبل از امضا برای فعالیت در میز وکیل.",
};

export default function CooperatePage() {
  return (
    <>
      <CooperateHero />
      <section className="mx-auto w-full max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-12 sm:pb-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-medium text-gold-deep">شرایط کلی</p>
            <h2 className="mt-3 font-heading text-2xl font-bold text-navy">چگونه همکاری شروع می‌شود؟</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-navy/70">
              <li>درخواست را کامل ارسال کنید؛ مدیریت مدارک و تخصص را بررسی می‌کند.</li>
              <li>در صورت تأیید، حساب «میز وکیل» با همان شماره موبایل ساخته می‌شود.</li>
              <li>رمز اولیه ورود همان شماره موبایل است و پس از ورود می‌توانید آن را تغییر دهید.</li>
              <li>
                برای هماهنگی بیشتر:{" "}
                <a href={`tel:${site.phoneRaw}`} className="text-gold-deep hover:underline" dir="ltr">
                  {site.phone}
                </a>
              </li>
            </ul>
            <p className="mt-6 text-sm text-navy/55">
              موکل هستید؟ از{" "}
              <Link href="/account/consult" className="text-gold-deep hover:underline">
                ثبت درخواست مشاوره
              </Link>{" "}
              استفاده کنید.
            </p>
          </div>
          <CooperateForm />
        </div>
      </section>
    </>
  );
}
