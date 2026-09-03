import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account/account-shell";
import { getServerUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/account";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پنل کاربری",
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) {
    redirect("/login?next=/account");
  }
  if (user.role === "lawyer") {
    redirect("/lawyer");
  }
  if (isStaffRole(user.role)) {
    redirect("/admin");
  }

  return <AccountShell user={user}>{children}</AccountShell>;
}
