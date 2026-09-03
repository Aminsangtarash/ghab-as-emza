import type { Metadata } from "next";

import { PanelSupport } from "@/components/panel/panel-support";
import { panelConsultHref } from "@/lib/account";

export const metadata: Metadata = {
  title: "پشتیبانی",
};

export default function LawyerSupportPage() {
  return <PanelSupport consultHref={panelConsultHref("/lawyer")} />;
}
