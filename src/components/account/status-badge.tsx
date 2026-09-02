import { consultationStatusMeta, type ConsultationStatus } from "@/lib/consult";
import { cn } from "@/lib/utils";

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
        "inline-flex rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-gold-deep",
        className,
      )}
    >
      {consultationStatusMeta[status].title}
    </span>
  );
}
