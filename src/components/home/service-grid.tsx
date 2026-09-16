import { ServiceCards } from "@/components/services/service-cards";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function ServiceGrid() {
  return (
    <section id="services" className="relative z-10 scroll-mt-24 bg-paper py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <p className="text-sm font-medium text-gold-deep">خدمات حقوقی</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-navy sm:text-3xl">
              موضوع را انتخاب کنید
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-navy/70">
              روی موضوع کلی بزنید، جزئیات را ببینید و خیلی سریع درخواست ثبت کنید. تخصیص وکیل فقط با مدیر است.
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={120}>
          <ServiceCards />
        </ScrollReveal>
      </div>
    </section>
  );
}
