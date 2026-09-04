import Image from "next/image";

export function CooperateHero() {
  return (
    <section className="relative overflow-hidden bg-navy-deep">
      <Image
        src="/images/hero-legal.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[center_30%]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-navy-deep from-[8%] via-navy-deep/90 via-50% to-navy-deep/40" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
        <p className="text-xs font-semibold tracking-wide text-gold">همکاری با قبل از امضا</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">درخواست همکاری وکلا</h1>
        <span className="mt-3 block h-1 w-14 rounded-full bg-gold" />
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
          اگر وکیل پایه یک هستید و می‌خواهید در پلتفرم مشاوره و پرونده فعالیت کنید، درخواست خود را ارسال کنید.
          پس از بررسی مدیریت، حساب میز وکیل برای شما ساخته می‌شود.
        </p>
      </div>
    </section>
  );
}
