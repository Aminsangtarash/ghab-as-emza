import type { Lawyer } from "@/lib/data";
import { lawyers, services } from "@/lib/data";
import { promoCodes as defaultPromos, type Promo } from "@/lib/promos";

let customLawyerCache: Lawyer[] = [];
let feeCache: Record<string, number> = {};
let promoCache: (Promo & { active: boolean })[] | null = null;

export function setCustomLawyerCache(items: Lawyer[]) {
  customLawyerCache = items;
}

export function setFeeCache(fees: Record<string, number>) {
  feeCache = fees;
}

export function setPromoCache(items: (Promo & { active: boolean })[]) {
  promoCache = items;
}

export function resolveLawyer(slug: string | undefined): Lawyer | undefined {
  if (!slug) return undefined;
  return lawyers.find((item) => item.slug === slug) ?? customLawyerCache.find((item) => item.slug === slug);
}

export function resolveServiceFee(slug: string) {
  return feeCache[slug] ?? services.find((s) => s.slug === slug)?.feeToman ?? 0;
}

export function resolvePromos(activeOnly = true) {
  const list = promoCache ?? defaultPromos.map((p) => ({ ...p, active: true }));
  return activeOnly ? list.filter((p) => p.active) : list;
}

export function getCustomLawyerCache() {
  return customLawyerCache;
}

export function getFeeCache() {
  return feeCache;
}
