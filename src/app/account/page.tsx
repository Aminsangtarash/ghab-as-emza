import { AccountOverview } from "@/components/account/account-overview";
import { getServerUser } from "@/lib/auth";
import { listUserConsultations, toClientConsultation } from "@/lib/store";

export default async function AccountPage() {
  const user = await getServerUser();
  const items = user ? (await listUserConsultations(user.id)).map(toClientConsultation) : [];
  if (!user) return null;

  return <AccountOverview user={user} items={items} />;
}
