import { ServiceCards } from "@/components/services/service-cards";

export function ServicesGrid() {
  return (
    <section className="bg-paper py-14 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <ServiceCards />
      </div>
    </section>
  );
}
