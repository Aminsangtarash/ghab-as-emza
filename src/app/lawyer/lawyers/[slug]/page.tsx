import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PanelLawyerProfile } from "@/components/panel/panel-lawyer-profile";
import { panelConsultHref, panelLawyersHref } from "@/lib/account";
import { getLawyer } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lawyer = getLawyer(slug);
  if (!lawyer) return { title: "متخصص یافت نشد" };
  return { title: lawyer.name };
}

export default async function LawyerDirectoryProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lawyer = getLawyer(slug);
  if (!lawyer) notFound();

  return (
    <PanelLawyerProfile
      lawyer={lawyer}
      backHref={panelLawyersHref("/lawyer")}
      consultHref={panelConsultHref("/lawyer", lawyer.slug)}
    />
  );
}
