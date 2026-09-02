import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { ServiceIcon } from "@/components/services/service-icon";
import { PageHero } from "@/components/page-hero";
import { buttonVariants } from "@/components/ui/button";
import { getService, services } from "@/lib/data";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return { title: "خدمت یافت نشد" };
  return { title: service.title, description: service.short };
}

export default async function ServiceDetailPage({
  params,
}: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  return (
    <>
      <PageHero title={service.title} description={service.short} />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 pt-10 sm:px-6 sm:pt-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-navy text-gold">
            <ServiceIcon name={service.icon} className="size-6" />
          </span>
          <p className="text-sm leading-8 text-navy/80">{service.description}</p>
          <h2 className="mt-8 font-heading text-xl font-semibold text-navy">خروجی این خدمت</h2>
          <ul className="mt-3 list-disc space-y-2 pr-5 text-sm leading-7 text-navy/75">
            {service.outcomes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy/10 sm:p-8">
          <span className="mb-3 block h-1 w-10 rounded-full bg-gold" />
          <h2 className="font-heading text-xl font-semibold text-navy">ثبت درخواست</h2>
          <p className="mt-3 text-sm leading-7 text-navy/70">
            نوع خدمت از قبل انتخاب شده است. نحوه مشاوره، وکیل و شرح موضوع را در چند مرحله کوتاه تکمیل
            کنید.
          </p>
          <Link
            href={`/consult?service=${service.slug}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 inline-flex h-11 gap-1 bg-gold px-6 text-navy-deep hover:bg-gold-bright",
            )}
          >
            ادامه ثبت درخواست
            <ChevronLeftIcon className="size-4" />
          </Link>
        </aside>
      </section>
    </>
  );
}
