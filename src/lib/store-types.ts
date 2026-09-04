import type { ConsultationStatus, PaymentStatus } from "@/lib/consult";
import type { ConsultationInput } from "@/lib/validations";

export type UserRole = "client" | "lawyer" | "admin" | "manager";

export function parseUserRole(role?: string | null): UserRole {
  if (role === "lawyer" || role === "admin" || role === "manager") return role;
  return "client";
}

export type PublicUser = {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  lawyerSlug?: string;
  walletBalance: number;
  active: boolean;
  email?: string;
  address?: string;
  avatarName?: string;
  createdAt: string;
  lastLoginAt?: string;
};

export type StoredUser = PublicUser & {
  passwordHash: string;
};

export type StoredConsultation = ConsultationInput & {
  id: string;
  userId: string;
  trackingCode: string;
  createdAt: string;
  lawyerVisible: boolean;
  feeToman: number;
  originalFeeToman: number;
  discountCode?: string;
  discountPercent: number;
  paymentStatus: PaymentStatus;
  status: ConsultationStatus;
  conversationId?: string;
  refundedToman: number;
  cancelReason?: string;
  documents: { id: string; originalName: string; size: number }[];
};

export type ClientConsultation = {
  id: string;
  trackingCode: string;
  createdAt: string;
  channel: StoredConsultation["channel"];
  service: string;
  serviceTitle: string;
  lawyerMode: StoredConsultation["lawyerMode"];
  lawyerName?: string;
  lawyerSlug?: string;
  lawyerPending: boolean;
  lawyerAccepted: boolean;
  subject: string;
  message: string;
  urgency: StoredConsultation["urgency"];
  caseStage: StoredConsultation["caseStage"];
  city?: string;
  hasDocuments: StoredConsultation["hasDocuments"];
  preferredSlot?: string;
  fullName: string;
  phone: string;
  email?: string;
  feeToman: number;
  originalFeeToman: number;
  discountCode?: string;
  discountPercent: number;
  paymentStatus: PaymentStatus;
  status: ConsultationStatus;
  conversationId?: string;
  refundedToman: number;
  cancelReason?: string;
  documents: { id: string; originalName: string; size: number }[];
};
