import type { Metadata } from "next";

import { LawyerClients } from "@/components/lawyer/lawyer-clients";

export const metadata: Metadata = {
  title: "موکلان",
};

export default function LawyerClientsPage() {
  return <LawyerClients />;
}
