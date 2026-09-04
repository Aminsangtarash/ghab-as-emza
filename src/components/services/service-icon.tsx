import {
  CalendarDaysIcon,
  FileSearchIcon,
  HeadsetIcon,
  ShieldIcon,
  UserRoundIcon,
  ZapIcon,
} from "lucide-react";

import type { Service } from "@/lib/data";

const icons = {
  urgent: ZapIcon,
  review: FileSearchIcon,
  consult: HeadsetIcon,
  inperson: CalendarDaysIcon,
  cases: ShieldIcon,
  lawyers: UserRoundIcon,
} as const;

export function ServiceIcon({
  name,
  className,
}: {
  name: Service["icon"];
  className?: string;
}) {
  const Icon = icons[name];
  return <Icon className={className} strokeWidth={1.5} />;
}
