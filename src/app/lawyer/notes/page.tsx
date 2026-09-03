import type { Metadata } from "next";

import { LawyerNotes } from "@/components/lawyer/lawyer-notes";

export const metadata: Metadata = {
  title: "یادداشت‌ها",
};

export default function LawyerNotesPage() {
  return <LawyerNotes />;
}
