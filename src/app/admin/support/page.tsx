import type { Metadata } from "next";

import { PanelSupport } from "@/components/panel/panel-support";
import { panelConsultHref } from "@/lib/account";

export const metadata: Metadata = {
  title: "پشتیبانی",
};

export default function AdminSupportPage() {
  return <PanelSupport consultHref={panelConsultHref("/admin")} />;
}
