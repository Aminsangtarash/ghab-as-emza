export type StoredConsultation = {
  id: string;
  trackingCode: string;
  fullName: string;
  phone: string;
  email?: string;
  service: string;
  message: string;
  createdAt: string;
};

const consultations: StoredConsultation[] = [];

export function saveConsultation(
  entry: Omit<StoredConsultation, "id" | "trackingCode" | "createdAt">,
) {
  const serial = String(consultations.length + 1).padStart(4, "0");
  const stored: StoredConsultation = {
    ...entry,
    id: crypto.randomUUID(),
    trackingCode: `QEM-1405-${serial}`,
    createdAt: new Date().toISOString(),
  };
  consultations.unshift(stored);
  return stored;
}

export function listConsultations() {
  return consultations;
}
