export const DEFAULT_DOCUMENT_REQUEST_TITLES = [
  "تصویر کارت ملی",
  "تصویر شناسنامه",
  "قرارداد / سند موضوع دعوا",
  "رسید، چک یا سفته (در صورت وجود)",
  "ابلاغیه یا اوراق قضایی (در صورت وجود)",
] as const;

export const documentRequestItemStatuses = ["pending", "uploaded", "approved", "rejected"] as const;
export type DocumentRequestItemStatus = (typeof documentRequestItemStatuses)[number];

export type ClientDocumentRequestItem = {
  id: string;
  title: string;
  sortOrder: number;
  status: DocumentRequestItemStatus;
  documentId?: string;
  documentName?: string;
  documentMimeType?: string;
  documentSize?: number;
  reviewedAt?: string;
  rejectReason?: string;
};

export type ClientDocumentRequest = {
  id: string;
  conversationId: string;
  consultationId: string;
  messageId?: string;
  note?: string;
  createdAt: string;
  trackingCode: string;
  items: ClientDocumentRequestItem[];
  pendingCount: number;
  uploadedCount: number;
  approvedCount: number;
};
