import {
  CalendarClockIcon,
  ClipboardListIcon,
  FolderOpenIcon,
  HandshakeIcon,
  HeadsetIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  NotebookPenIcon,
  PercentIcon,
  PlusIcon,
  ScaleIcon,
  ShieldIcon,
  StarIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { canStaff } from "@/lib/admin-permissions";
import type { UserRole } from "@/lib/store-types";

export const accountNav = [
  { href: "/account", label: "داشبورد", exact: true, icon: LayoutDashboardIcon },
  { href: "/account/requests", label: "درخواست‌ها", exact: false, icon: ClipboardListIcon },
  { href: "/account/consult", label: "ثبت درخواست", exact: false, icon: PlusIcon },
  { href: "/account/chats", label: "گفتگوها", exact: false, icon: MessageCircleIcon },
  { href: "/account/cases", label: "پرونده‌ها", exact: false, icon: FolderOpenIcon },
  { href: "/account/lawyers", label: "وکلا و متخصصان", exact: false, icon: UsersIcon },
  { href: "/account/profile", label: "حساب کاربری", exact: false, icon: UserRoundIcon },
  { href: "/account/support", label: "پشتیبانی", exact: false, icon: HeadsetIcon },
] as const;

export const lawyerNav = [
  { href: "/lawyer", label: "میز کار", exact: true, icon: LayoutDashboardIcon },
  { href: "/lawyer/requests", label: "درخواست‌های جدید", exact: false, icon: ClipboardListIcon },
  { href: "/lawyer/chats", label: "گفتگوها", exact: false, icon: MessageCircleIcon },
  { href: "/lawyer/cases", label: "پرونده‌ها", exact: false, icon: FolderOpenIcon },
  { href: "/lawyer/schedule", label: "نوبت‌ها", exact: false, icon: CalendarClockIcon },
  { href: "/lawyer/clients", label: "موکلان", exact: false, icon: UsersIcon },
  { href: "/lawyer/earnings", label: "درآمد", exact: false, icon: WalletIcon },
  { href: "/lawyer/ratings", label: "امتیازها", exact: false, icon: StarIcon },
  { href: "/lawyer/notes", label: "یادداشت‌ها", exact: false, icon: NotebookPenIcon },
  { href: "/lawyer/profile", label: "پروفایل من", exact: false, icon: UserRoundIcon },
  { href: "/lawyer/lawyers", label: "وکلا و متخصصان", exact: false, icon: ScaleIcon },
  { href: "/lawyer/support", label: "پشتیبانی", exact: false, icon: HeadsetIcon },
] as const;

export const adminNav = [
  { href: "/admin", label: "نمای کلی", exact: true, icon: LayoutDashboardIcon, capability: "viewDashboard" as const },
  { href: "/admin/queue", label: "صف عملیات", exact: false, icon: ClipboardListIcon, capability: "manageQueue" as const },
  { href: "/admin/requests", label: "درخواست‌ها", exact: false, icon: FolderOpenIcon, capability: "manageRequests" as const },
  { href: "/admin/users", label: "کاربران", exact: false, icon: UsersIcon, capability: "manageUsers" as const },
  { href: "/admin/lawyers", label: "وکلا", exact: false, icon: ScaleIcon, capability: "manageLawyers" as const },
  { href: "/admin/cooperate", label: "همکاری", exact: false, icon: HandshakeIcon, capability: "createLawyer" as const },
  { href: "/admin/staff", label: "کارکنان", exact: false, icon: ShieldIcon, capability: "manageStaff" as const },
  { href: "/admin/pricing", label: "تعرفه و تخفیف", exact: false, icon: PercentIcon, capability: "managePromos" as const },
  { href: "/admin/support", label: "پشتیبانی", exact: false, icon: HeadsetIcon, capability: "viewSupport" as const },
] as const;

export function adminNavForRole(role: UserRole | string | undefined) {
  return adminNav.filter((item) => canStaff(role, item.capability));
}

export function isStaffRole(role: UserRole | string | undefined) {
  return role === "admin" || role === "manager";
}

export function panelLawyersHref(
  prefix: "/account" | "/lawyer" | "/admin",
  slug?: string,
) {
  return slug ? `${prefix}/lawyers/${slug}` : `${prefix}/lawyers`;
}

export function panelConsultHref(
  prefix: "/account" | "/lawyer" | "/admin",
  lawyerSlug?: string,
) {
  const base = prefix === "/account" ? "/account/consult" : "/consult";
  return lawyerSlug ? `${base}?lawyer=${lawyerSlug}` : base;
}

export function panelHome(role: UserRole | string | undefined) {
  if (role === "lawyer") return "/lawyer";
  if (isStaffRole(role)) return "/admin";
  return "/account";
}

export function panelLabel(role: UserRole | string | undefined) {
  if (role === "lawyer") return "میز وکیل";
  if (role === "admin") return "پنل ادمین";
  if (role === "manager") return "پنل مدیر";
  return "پنل کاربری";
}

export function accountRoleLabel(role: UserRole | string | undefined) {
  if (role === "lawyer") return "وکیل";
  if (role === "admin") return "ادمین";
  if (role === "manager") return "مدیر";
  return "کاربر";
}

export function accountAvatarSrc(avatarName?: string) {
  return avatarName ? `/api/account/avatar?v=${encodeURIComponent(avatarName)}` : undefined;
}

export function accountBreadcrumb(pathname: string): { href: string; label: string }[] {
  if (pathname === "/account") {
    return [
      { href: "/account/profile", label: "حساب کاربری" },
      { href: "/account", label: "داشبورد" },
    ];
  }

  const home = { href: "/account", label: "داشبورد" };

  const sections: { href: string; label: string; leaf?: string }[] = [
    { href: "/account/wallet", label: "کیف پول" },
    { href: "/account/profile", label: "حساب کاربری" },
    { href: "/account/support", label: "پشتیبانی" },
    { href: "/account/consult", label: "ثبت درخواست" },
    { href: "/account/cases", label: "پرونده‌ها", leaf: "جزئیات پرونده" },
    { href: "/account/chats", label: "گفتگوها", leaf: "گفتگو" },
    { href: "/account/lawyers", label: "وکلا و متخصصان", leaf: "پروفایل وکیل" },
    { href: "/account/requests", label: "درخواست‌ها", leaf: "جزئیات" },
  ];

  const match = sections.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (!match) return [home];

  const crumbs = [home, { href: match.href, label: match.label }];
  if (pathname !== match.href && match.leaf) {
    crumbs.push({ href: pathname, label: match.leaf });
  }
  return crumbs;
}

export function isAccountPath(pathname: string) {
  return pathname === "/account" || pathname.startsWith("/account/");
}

export function isLawyerPath(pathname: string) {
  return pathname === "/lawyer" || pathname.startsWith("/lawyer/");
}

export function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isPanelPath(pathname: string) {
  return isAccountPath(pathname) || isLawyerPath(pathname) || isAdminPath(pathname);
}

export function panelGreeting(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Tehran",
    }).format(date),
  );
  if (hour < 5 || hour >= 21) return "شب بخیر";
  if (hour < 12) return "صبح بخیر";
  if (hour < 17) return "وقت بخیر";
  return "عصر بخیر";
}
