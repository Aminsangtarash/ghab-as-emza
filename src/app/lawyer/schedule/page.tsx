import type { Metadata } from "next";

import { LawyerSchedule } from "@/components/lawyer/lawyer-schedule";

export const metadata: Metadata = {
  title: "نوبت‌ها",
};

export default function LawyerSchedulePage() {
  return <LawyerSchedule />;
}
