import type { Metadata } from "next";

import { LawyerProfileForm } from "@/components/lawyer/lawyer-profile-form";

export const metadata: Metadata = {
  title: "پروفایل وکیل",
};

export default function LawyerProfilePage() {
  return <LawyerProfileForm />;
}
