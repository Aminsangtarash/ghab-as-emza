import Image from "next/image";
import Link from "next/link";
import {
  Clock3Icon,
  HeadsetIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const highlights = [
  { title: "ماموریت", text: "کمک به تصمیم درست، قبل از امضا و قبل از طرح دعوا." },
  { title: "رویکرد", text: "حداقل داده، پاسخ مستند، و مسیر پیگیری مشخص." },
  { title: "تعهد", text: "وعده نتیجه قطعی دادگاه نمی‌دهیم؛ مسیر حقوقی را شفاف می‌کنیم." },
];

const features = [
  {
    title: "پاسخگویی سریع",
    text: "درخواست‌ها در ساعات کاری بررسی و با کد پیگیری پاسخ داده می‌شود.",
    icon: HeadsetIcon,
  },
  {
    title: "مشاوره تخصصی",
    text: "هر موضوع به وکیل یا کارشناس همان حوزه ارجاع می‌شود.",
    icon: ShieldCheckIcon,
  },
  {
    title: "محرمانگی اطلاعات",
    text: "اسناد و شرح پرونده فقط در مسیر رسمی و محدود رد و بدل می‌شود.",
    icon: LockKeyholeIcon,
  },
  {
    title: "دسترسی منظم",
    text: site.hours,
    icon: Clock3Icon,
  },
];

export function AboutContent() {
  return (
    <section className="relative z-10 bg-paper pb-16 pt-10 sm:pt-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-navy/8 sm:p-10 lg:grid-cols-2">
          <div>
            <span className="mb-3 block h-1 w-10 rounded-full bg-gold" />
            <h2 className="font-heading text-2xl font-bold text-navy">داستان {site.name}</h2>
            <p className="mt-4 text-sm leading-8 text-navy/75 sm:text-base">
              بسیاری از اختلاف‌های حقوقی از بندی شروع می‌شود که در لحظه امضا «واضح» به نظر می‌رسید.
              ما برای همان لحظه کار می‌کنیم: وقتی هنوز فرصت اصلاح، پرسش و انتخاب مسیر درست وجود دارد.
            </p>
            <p className="mt-4 text-sm leading-8 text-navy/75 sm:text-base">
              {site.name} مشاوره و خدمات حقوقی را طوری طراحی کرده که هم کیفیت کارشناسی حفظ شود و هم
              اطلاعات شما در مسیری کنترل‌شده بماند؛ نه در پیام‌رسان عمومی.
            </p>
            <ul className="mt-8 space-y-4">
              {highlights.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-gold" />
                  <div>
                    <h3 className="font-heading font-semibold text-navy">{item.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-navy/65">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/consult"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 bg-navy px-6 text-white hover:bg-navy-mid",
                )}
              >
                درخواست مشاوره
              </Link>
              <Link
                href="/lawyers"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-navy/15 px-6 text-navy",
                )}
              >
                وکلا و متخصصان
              </Link>
            </div>
          </div>

          <div>
            <span className="mb-3 block h-1 w-10 rounded-full bg-gold" />
            <h2 className="font-heading text-2xl font-bold text-navy">چشم‌انداز ما</h2>
            <p className="mt-4 text-sm leading-8 text-navy/75 sm:text-base">
              دسترسی به مشاوره حقوقی باید ساده، محرمانه و قابل پیگیری باشد؛ بدون وعده نتیجه قطعی و بدون
              پراکندگی مدارک در کانال‌های غیررسمی.
            </p>
            <div className="relative mt-6 h-56 overflow-hidden rounded-2xl sm:h-72">
              <Image
                src="/images/article-books.jpg"
                alt="کتاب‌های حقوقی"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 28vw, 100vw"
              />
            </div>
            <div className="mt-5 rounded-2xl bg-navy p-5 text-white">
              <p className="text-sm font-medium text-gold">چرا قبل از امضا؟</p>
              <p className="mt-2 text-sm leading-7 text-white/80">
                چون یک بررسی کارشناسی امروز، معمولاً از ماه‌ها دادرسی فردا کم‌هزینه‌تر است.
              </p>
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
