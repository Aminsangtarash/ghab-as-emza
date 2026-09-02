import Image from "next/image";

export function ContactHero() {
  return (
    <section className="relative overflow-hidden bg-navy-deep">
      <Image
        src="/images/hero-legal.jpg"
        alt=""
        fill
        priority
        className="object-cover object-left"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-navy-deep from-[8%] via-navy-deep/90 via-50% to-navy-deep/35" />
      <div
        className="pointer-events-none absolute inset-y-10 left-8 hidden w-24 opacity-30 lg:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(255 255 255 / 0.55) 1.3px, transparent 1.4px)",
          backgroundSize: "13px 13px",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
        <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">تماس با ما</h1>
        <span className="mt-3 block h-1 w-14 rounded-full bg-gold" />
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
          برای هماهنگی اداری پیام بگذارید. موضوع حقوقی را از مسیر مشاوره آنلاین پیگیری کنید تا پاسخ
          مستند و قابل‌پیگیری باشد.
        </p>
      </div>
    </section>
  );
}
