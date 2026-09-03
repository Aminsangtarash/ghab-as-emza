import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LawyerShell } from "@/components/lawyer/lawyer-shell";
import { isStaffRole } from "@/lib/account";
import { getServerUser } from "@/lib/auth";
import { getLawyer } from "@/lib/data";
import { ensureLawyerAccounts } from "@/lib/lawyer-accounts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "میز وکیل",
};

export default async function LawyerLayout({ children }: { children: React.ReactNode }) {
  await ensureLawyerAccounts();
  const user = await getServerUser();
  if (!user) {
    redirect("/login?next=/lawyer");
  }
  if (isStaffRole(user.role)) {
    redirect("/admin");
  }
  if (user.role !== "lawyer") {
    redirect("/account");
  }

  const lawyer = user.lawyerSlug ? getLawyer(user.lawyerSlug) : undefined;

  return (
    <LawyerShell user={user} lawyer={lawyer}>
      {children}
    </LawyerShell>
  );
}
