import {
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  FileSearchIcon,
  FileTextIcon,
  GavelIcon,
  HandshakeIcon,
  HeadsetIcon,
  HomeIcon,
  ScaleIcon,
  ScrollTextIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";

import type { CatalogIcon } from "@/lib/legal-catalog";

const icons: Record<CatalogIcon, typeof HeadsetIcon> = {
  consult: HeadsetIcon,
  petitions: FileTextIcon,
  contracts: FileSearchIcon,
  family: UsersIcon,
  property: HomeIcon,
  criminal: GavelIcon,
  inheritance: ScrollTextIcon,
  companies: BriefcaseIcon,
  labor: Building2Icon,
  registry: ScaleIcon,
  arbitration: HandshakeIcon,
  cases: ShieldIcon,
};

export function ServiceIcon({
  name,
  className,
}: {
  name: CatalogIcon | "urgent" | "review" | "inperson" | "lawyers" | "consult" | "cases";
  className?: string;
}) {
  const mapped: CatalogIcon =
    name === "urgent" || name === "consult"
      ? "consult"
      : name === "review"
        ? "contracts"
        : name === "inperson"
          ? "consult"
          : name === "lawyers"
            ? "consult"
            : name;
  const Icon = icons[mapped] ?? CalendarDaysIcon;
  return <Icon className={className} strokeWidth={1.5} />;
}
