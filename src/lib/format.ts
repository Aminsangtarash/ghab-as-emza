const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => faDigits[Number(digit)]);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${toFaDigits(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${toFaDigits(Math.round(bytes / 1024))} کیلوبایت`;
  return `${toFaDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
}

export function formatToman(amount: number) {
  if (amount <= 0) return "رایگان";
  return formatTomanAmount(amount);
}

export function formatTomanAmount(amount: number) {
  return `${toFaDigits(Math.abs(amount).toLocaleString("en-US").replace(/,/g, "٬"))} تومان`;
}

export function formatFaDate(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR");
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

export function formatFaLongDate(date = new Date()) {
  return date.toLocaleDateString("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatFaRelative(iso: string, now = new Date()) {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60_000));
  if (minutes < 1) return "همین حالا";
  if (minutes < 60) return `${toFaDigits(minutes)} دقیقه پیش`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${toFaDigits(hours)} ساعت پیش`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${toFaDigits(days)} روز پیش`;
  return formatFaDate(iso);
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
