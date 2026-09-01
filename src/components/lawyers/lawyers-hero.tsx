export function LawyersHero() {
  return (
    <section className="relative overflow-hidden bg-navy-deep">
      <div
        className="absolute inset-0 bg-cover bg-left opacity-20"
        style={{ backgroundImage: "url('/images/hero-legal.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-navy-deep via-navy-deep/92 to-navy/85" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-14">
        <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">
          وکلا و متخصصان
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
          وکیل مناسب را بر اساس تخصص و شهر انتخاب کنید؛ مسیر مشاوره کوتاه و مشخص است.
        </p>
      </div>
    </section>
  );
}
