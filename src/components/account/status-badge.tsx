import { consultationStatusMeta, type ConsultationStatus } from "@/lib/consult";
import { cn } from "@/lib/utils";

const statusTone: Record<ConsultationStatus, string> = {
  "awaiting-operator": "bg-gold/18 text-gold-deep",
  "awaiting-lawyer": "bg-navy/8 text-navy",
  "awaiting-reselect": "bg-orange-50 text-orange-900",
  "cancel-requested": "bg-amber-50 text-amber-900",
  "in-progress": "bg-gold/28 text-navy-deep",
  closed: "bg-paper text-navy/55 ring-1 ring-navy/8",
  cancelled: "bg-red-50 text-red-800",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ConsultationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
        statusTone[status],
        className,
      )}
    >
      {consultationStatusMeta[status].title}
    </span>
  );
}
