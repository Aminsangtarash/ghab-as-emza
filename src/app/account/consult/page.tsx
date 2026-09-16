import type { Metadata } from "next";
import Link from "next/link";

import { OpenServiceRequest, RequestServiceCta } from "@/components/request/request-service-button";
import { getServerUser } from "@/lib/auth";
import { getCatalogItem } from "@/lib/legal-catalog";

export const metadata: Metadata = {
  title: "ثبت درخواست",
};

export default async function AccountConsultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await getServerUser();
  const params = await searchParams;
  const serviceSlug = typeof params.service === "string" ? params.service : undefined;
  const item = serviceSlug ? getCatalogItem(serviceSlug) : undefined;

  return (
    <div>
      {item ? <OpenServiceRequest serviceSlug={item.slug} /> : null}
      <p className="mb-1 text-sm font-medium text-gold-deep">درخواست</p>
      <span className="mb-4 mt-3 block h-1 w-12 rounded-full bg-gold" />
      <h1 className="font-heading text-2xl font-bold text-navy">
        {item ? item.title : "ثبت درخواست حقوقی"}
      </h1>
      <p className="mt-2 mb-6 max-w-2xl text-sm leading-7 text-navy/65">
        درخواست شما اول به مدیر می‌رسد. وکیل تا تخصیص مدیر آن را نمی‌بیند و مبلغ را مدیر اعلام می‌کند.
      </p>
      {item ? (
        <RequestServiceCta serviceSlug={item.slug} label="ثبت درخواست" />
      ) : (
        <p className="text-sm text-navy/60">
          برای ثبت سریع، ابتدا از{" "}
          <Link href="/services" className="text-gold-deep hover:underline">
            فهرست خدمات
          </Link>{" "}
          موضوع را انتخاب کنید.
        </p>
      )}
    </div>
  );
}
