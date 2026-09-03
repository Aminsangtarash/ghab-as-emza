import type { Metadata } from "next";

import { PanelLawyersDirectory } from "@/components/panel/panel-lawyers-directory";

export const metadata: Metadata = {
  title: "وکلا و متخصصان",
};

export default function LawyerDirectoryPage() {
  return <PanelLawyersDirectory prefix="/lawyer" />;
}
