import type { Metadata } from "next";

import { AccountCases } from "@/components/account/account-cases";

export const metadata: Metadata = {
  title: "پرونده‌ها",
};

export default async function AccountCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { request } = await searchParams;
  return <AccountCases fromCode={request} />;
}
