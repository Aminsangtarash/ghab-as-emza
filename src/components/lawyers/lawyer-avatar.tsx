import Image from "next/image";

import { cn } from "@/lib/utils";

export function LawyerAvatar({
  src,
  name,
  className,
  size = 64,
}: {
  src: string;
  name: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-navy ring-2 ring-gold/30",
        className,
      )}
    >
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="size-full object-cover object-top"
      />
    </span>
  );
}
