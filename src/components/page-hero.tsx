export function PageHero({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <section className="border-b border-navy/10 bg-navy text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
