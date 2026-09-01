const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => faDigits[Number(digit)]);
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
