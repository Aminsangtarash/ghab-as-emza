import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-3 text-navy", className)}
      aria-label="قبل از امضا، صفحه اصلی"
    >
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm ring-1 ring-navy/10">
        <Image
          src="/images/logo.png"
          alt=""
          width={48}
          height={45}
          className="h-10 w-auto object-contain"
          priority
        />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-heading text-lg font-bold tracking-tight">
            قبل از امضا
          </span>
          <span className="block text-[12px] font-medium opacity-70">
            مشاوره و خدمات حقوقی
          </span>
        </span>
      )}
    </Link>
  );
}
