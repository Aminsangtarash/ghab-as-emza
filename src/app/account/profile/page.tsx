import type { Metadata } from "next";

import { AccountProfile } from "@/components/account/account-profile";
import { getServerUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "حساب کاربری",
};

export default async function AccountProfilePage() {
  const user = await getServerUser();
  if (!user) return null;

  return <AccountProfile user={user} />;
}
