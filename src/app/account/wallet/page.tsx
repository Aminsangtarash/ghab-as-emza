import type { Metadata } from "next";

import { AccountWallet } from "@/components/account/account-wallet";
import { getServerUser } from "@/lib/auth";
import { getWalletOverview } from "@/lib/conversations";

export const metadata: Metadata = {
  title: "کیف پول",
};

export default async function AccountWalletPage() {
  const user = await getServerUser();
  if (!user) return null;

  const overview = await getWalletOverview(user.id);
  return (
    <AccountWallet
      balance={user.walletBalance}
      count={overview.count}
      credited={overview.credited}
      entries={overview.entries}
    />
  );
}
