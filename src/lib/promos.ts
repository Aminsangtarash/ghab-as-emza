import { toEnDigits } from "@/lib/format";

export type Promo = {
  code: string;
  percent: number;
  title: string;
};

export const promoCodes: Promo[] = [
  { code: "QEM10", percent: 10, title: "تخفیف ۱۰ درصد" },
  { code: "QEM20", percent: 20, title: "تخفیف ۲۰ درصد" },
  { code: "WELCOME", percent: 15, title: "تخفیف خوش‌آمدگویی" },
];

export function normalizePromoCode(value: string) {
  return toEnDigits(value).trim().toUpperCase().replace(/\s+/g, "");
}

export function lookupPromo(code?: string | null) {
  if (!code) return null;
  const needle = normalizePromoCode(code);
  if (!needle) return null;
  return promoCodes.find((item) => item.code === needle) ?? null;
}

export function quotePayment(originalToman: number, code?: string | null) {
  const trimmed = code?.trim() ? normalizePromoCode(code) : "";
  if (!trimmed) {
    return {
      originalToman,
      feeToman: originalToman,
      discountToman: 0,
      discountPercent: 0,
      discountCode: undefined as string | undefined,
    };
  }

  const promo = lookupPromo(trimmed);
  if (!promo) {
    return { error: "کد تخفیف نامعتبر است." };
  }

  const discountToman = Math.min(originalToman, Math.round((originalToman * promo.percent) / 100));
  return {
    originalToman,
    feeToman: originalToman - discountToman,
    discountToman,
    discountPercent: promo.percent,
    discountCode: promo.code,
    promo,
  };
}
