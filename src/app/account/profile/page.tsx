import type { Metadata } from "next";

import { AccountProfile } from "@/components/account/account-profile";
import { getServerUser } from "@/lib/auth";
import { listWalletEntries } from "@/lib/conversations";

export const metadata: Metadata = {
  title: "حساب کاربری",
};

export default async function AccountProfilePage() {
  const user = await getServerUser();
  if (!user) return null;

  const entries = await listWalletEntries(user.id);
  return <AccountProfile user={user} walletEntries={entries} />;
}
