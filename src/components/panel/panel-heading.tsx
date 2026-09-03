export function PanelHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gold-deep">{kicker}</p>
      <span className="mt-3 block h-1 w-12 rounded-full bg-gold" />
      <h1 className="mt-4 font-heading text-2xl font-bold text-navy">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/65">{description}</p>
    </div>
  );
}
