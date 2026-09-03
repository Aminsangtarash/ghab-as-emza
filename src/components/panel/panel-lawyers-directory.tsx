import { LawyersExplorer } from "@/components/lawyers/lawyers-explorer";
import { PanelHeading } from "@/components/panel/panel-heading";

export function PanelLawyersDirectory({
  prefix,
  initialQuery = "",
}: {
  prefix: "/account" | "/lawyer" | "/admin";
  initialQuery?: string;
}) {
  return (
    <div>
      <PanelHeading
        kicker="شبکه متخصصان"
        title="وکلا و متخصصان"
        description="فهرست وکلا و کارشناسان همکار. پروفایل هر نفر را ببینید و در صورت نیاز از همین مسیر مشاوره ثبت کنید."
      />
      <LawyersExplorer key={initialQuery} embedded panelPrefix={prefix} initialQuery={initialQuery} />
    </div>
  );
}
