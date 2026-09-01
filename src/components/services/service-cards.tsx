import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { ServiceIcon } from "@/components/services/service-icon";
import { Card, CardContent } from "@/components/ui/card";
import { services } from "@/lib/data";

function serviceHref(slug: string) {
  return slug === "lawyers" ? "/lawyers" : `/services/${slug}`;
}

export function ServiceCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
            <Card
              key={service.slug}
              className="border border-navy/8 bg-white py-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
          <CardContent className="flex h-full flex-col items-center p-7 text-center">
            <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-navy/5 text-navy">
              <ServiceIcon name={service.icon} className="size-8 text-navy" />
            </span>
            <h2 className="font-heading text-lg font-bold text-navy">
              {service.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-7 text-navy/65">
              {service.short}
            </p>
            <Link
              href={serviceHref(service.slug)}
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-navy transition-colors hover:text-gold-deep"
            >
              اطلاعات بیشتر
              <ChevronLeftIcon className="size-4" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
