import type { Metadata } from "next";

import { PanelLawyersDirectory } from "@/components/panel/panel-lawyers-directory";

export const metadata: Metadata = {
  title: "وکلا و متخصصان",
};

export default async function AccountLawyersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <PanelLawyersDirectory prefix="/account" initialQuery={q?.trim() ?? ""} />;
}
