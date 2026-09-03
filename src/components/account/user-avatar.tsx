import { accountAvatarSrc } from "@/lib/account";
import { initials } from "@/lib/format";
import type { PublicUser } from "@/lib/store";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-10 text-sm",
  md: "size-12 text-lg",
  lg: "size-[5.5rem] text-2xl sm:size-24",
} as const;

export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user: Pick<PublicUser, "fullName" | "avatarName">;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const src = accountAvatarSrc(user.avatarName);
  const box = cn("shrink-0 overflow-hidden rounded-full", sizes[size], className);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={cn(box, "object-cover")} />
    );
  }

  return (
    <span className={cn(box, "flex items-center justify-center bg-gold font-heading font-bold text-navy-deep")}>
      {initials(user.fullName)}
    </span>
  );
}
