import type { Metadata } from "next";

import { PanelSupport } from "@/components/panel/panel-support";
import { panelConsultHref } from "@/lib/account";

export const metadata: Metadata = {
  title: "پشتیبانی",
};

export default function AccountSupportPage() {
  return <PanelSupport consultHref={panelConsultHref("/account")} />;
}
