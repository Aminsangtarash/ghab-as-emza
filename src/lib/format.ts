const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => faDigits[Number(digit)]);
}

export function formatToman(amount: number) {
  if (amount <= 0) return "رایگان";
  return `${toFaDigits(amount.toLocaleString("en-US").replace(/,/g, "٬"))} تومان`;
}

export function formatFaDateTime(iso: string) {
  return new Date(iso).toLocaleString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

export function toEnDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) => String(faDigits.indexOf(digit)));
}

export function normalizePhone(value: string) {
  const trimmed = value.replace(/[\s-]/g, "");
  if (trimmed.startsWith("+98")) {
    return `0${trimmed.slice(3)}`;
  }
  if (trimmed.startsWith("0098")) {
    return `0${trimmed.slice(4)}`;
  }
  return trimmed;
}
