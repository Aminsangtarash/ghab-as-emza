import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsultationForm } from "@/components/consult/consultation-form";
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
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
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
          <Link
            href="/consult"
            className={cn(
              buttonVariants(),
              "mt-8 h-11 bg-gold px-6 text-navy-deep hover:bg-gold-bright",
            )}
          >
            درخواست این خدمت
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/10">
          <h2 className="font-heading text-lg font-semibold text-navy">درخواست سریع</h2>
          <p className="mt-1 mb-5 text-sm text-navy/70">
            فرم را پر کنید؛ کد پیگیری بلافاصله صادر می‌شود.
          </p>
          <ConsultationForm defaultService={service.slug} />
        </div>
      </section>
    </>
  );
}
