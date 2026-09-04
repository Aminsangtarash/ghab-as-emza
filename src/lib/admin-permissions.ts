import type { UserRole } from "@/lib/store-types";
import { isStaffRole } from "@/lib/account";

export const PRIMARY_MANAGER_PHONE = "09109667191";

export type StaffCapability =
  | "viewDashboard"
  | "manageQueue"
  | "manageRequests"
  | "viewRequestSecrets"
  | "manageUsers"
  | "adjustWallet"
  | "manageLawyers"
  | "createLawyer"
  | "manageStaff"
  | "managePromos"
  | "manageFees"
  | "viewSupport";

const managerCaps: StaffCapability[] = [
  "viewDashboard",
  "manageQueue",
  "manageRequests",
  "viewRequestSecrets",
  "manageUsers",
  "adjustWallet",
  "manageLawyers",
  "createLawyer",
  "manageStaff",
  "managePromos",
  "manageFees",
  "viewSupport",
];

const adminCaps: StaffCapability[] = [
  "viewDashboard",
  "manageQueue",
  "manageRequests",
  "manageUsers",
  "adjustWallet",
  "manageLawyers",
  "createLawyer",
  "managePromos",
  "manageFees",
  "viewSupport",
];

export function staffCapabilities(role: UserRole | string | undefined): StaffCapability[] {
  if (role === "manager") return managerCaps;
  if (role === "admin") return adminCaps;
  return [];
}

export function canStaff(role: UserRole | string | undefined, capability: StaffCapability) {
  return staffCapabilities(role).includes(capability);
}

export function requireStaffRole(role: UserRole | string | undefined) {
  return isStaffRole(role);
}
