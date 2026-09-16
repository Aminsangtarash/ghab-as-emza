"use client";

import { useEffect, useRef } from "react";
import { ChevronLeftIcon } from "lucide-react";

import { useServiceRequest } from "@/components/request/service-request-provider";
import { ServiceIcon } from "@/components/services/service-icon";
import { buttonVariants } from "@/components/ui/button";
import type { CatalogCategory } from "@/lib/legal-catalog";
import { cn } from "@/lib/utils";

export function ServiceCategoryItems({ category }: { category: CatalogCategory }) {
  const { openRequest } = useServiceRequest();

  return (
    <>
      {category.groups.map((group) => (
        <div key={group.title} className="mb-12 last:mb-0">
          <h2 className="font-heading text-xl font-semibold text-navy">{group.title}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => openRequest(item.slug)}
                className="cursor-pointer rounded-2xl bg-white p-5 text-start shadow-sm ring-1 ring-navy/8 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  className={
                    index % 2 === 1
                      ? "mb-3 flex size-10 items-center justify-center rounded-xl bg-gold/15 text-gold"
                      : "mb-3 flex size-10 items-center justify-center rounded-xl bg-navy/5 text-navy"
                  }
                >
                  <ServiceIcon name={category.icon} className="size-5" />
                </span>
                <h3 className="font-heading text-base font-bold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-navy/65">{item.short}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold-deep">
                  ثبت درخواست
                  <ChevronLeftIcon className="size-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function RequestServiceCta({
  serviceSlug,
  label,
  className,
}: {
  serviceSlug: string;
  label: string;
  className?: string;
}) {
  const { openRequest } = useServiceRequest();
  return (
    <button
      type="button"
      onClick={() => openRequest(serviceSlug)}
      className={cn(buttonVariants(), "bg-gold text-navy-deep hover:bg-gold-bright", className)}
    >
      {label}
    </button>
  );
}

export function OpenServiceRequest({ serviceSlug }: { serviceSlug: string }) {
  const { openRequest } = useServiceRequest();
  const opened = useRef<string | null>(null);

  useEffect(() => {
    if (opened.current === serviceSlug) return;
    opened.current = serviceSlug;
    openRequest(serviceSlug);
  }, [openRequest, serviceSlug]);

  return null;
}
