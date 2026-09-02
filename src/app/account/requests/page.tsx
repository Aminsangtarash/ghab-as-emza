import type { Metadata } from "next";

import { RequestsList } from "@/components/account/requests-list";
import { getServerUser } from "@/lib/auth";
import { listUserConsultations, toClientConsultation } from "@/lib/store";

export const metadata: Metadata = {
  title: "درخواست‌ها",
};

export default async function AccountRequestsPage() {
  const user = await getServerUser();
  const items = user ? (await listUserConsultations(user.id)).map(toClientConsultation) : [];

  return <RequestsList items={items} />;
}
