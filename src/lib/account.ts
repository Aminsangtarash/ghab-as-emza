import {
  ClipboardListIcon,
  LayoutDashboardIcon,
  PlusIcon,
  UserRoundIcon,
} from "lucide-react";

export const accountNav = [
  { href: "/account", label: "خلاصه", exact: true, icon: LayoutDashboardIcon },
  { href: "/account/requests", label: "درخواست‌ها", exact: false, icon: ClipboardListIcon },
  { href: "/account/consult", label: "ثبت درخواست", exact: false, icon: PlusIcon },
  { href: "/account/profile", label: "حساب کاربری", exact: false, icon: UserRoundIcon },
] as const;

export function isAccountPath(pathname: string) {
  return pathname === "/account" || pathname.startsWith("/account/");
}
