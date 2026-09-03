import { LawyerOverview } from "@/components/lawyer/lawyer-overview";
import { getServerUser } from "@/lib/auth";

export default async function LawyerHomePage() {
  const user = await getServerUser();
  return <LawyerOverview lawyerName={user?.fullName ?? "وکیل"} />;
}
