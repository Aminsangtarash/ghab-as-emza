"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { stats } from "@/lib/data";

export function StatsBand() {
  return (
    <section className="relative z-10 overflow-hidden bg-navy">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(201_162_39/0.12),transparent_55%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4">
        {stats.map((item, index) => (
          <ScrollReveal key={item.label} delay={index * 90}>
            <div className="text-center">
              <p className="font-heading text-3xl font-bold text-gold sm:text-4xl">
                {item.value}
              </p>
              <p className="mt-2 text-sm text-white/80">{item.label}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
