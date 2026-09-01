import {
  FilePenLineIcon,
  FileSearchIcon,
  HeadsetIcon,
  ScaleIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react";

import type { Service } from "@/lib/data";

const icons = {
  file: FilePenLineIcon,
  review: FileSearchIcon,
  consult: HeadsetIcon,
  arbitration: ScaleIcon,
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
