import Image from "next/image";

export function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-navy-deep">
      <div
        className="pointer-events-none absolute inset-y-10 left-6 hidden w-28 opacity-25 lg:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(201 162 39 / 0.7) 1.4px, transparent 1.5px)",
          backgroundSize: "13px 13px",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16 lg:grid-cols-2">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">درباره ما</h1>
          <span className="mt-3 block h-1 w-14 rounded-full bg-gold" />
          <p className="mt-4 max-w-md text-sm leading-7 text-white/75 sm:text-base">
            قبل از امضا برای تصمیم حقوقی آگاهانه ساخته شده است؛ با اولویت امنیت اطلاعات و کیفیت کارشناسی.
          </p>
        </div>
        <div className="relative hidden h-52 overflow-hidden rounded-2xl sm:block lg:h-56">
          <Image
            src="/images/hero-legal.jpg"
            alt=""
            fill
            priority
            className="object-cover object-left"
            sizes="(min-width: 1024px) 28rem, 90vw"
          />
          <div className="absolute inset-0 bg-navy-deep/25" />
        </div>
      </div>
    </section>
  );
}
