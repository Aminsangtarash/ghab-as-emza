export function safeInternalPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return undefined;
  }
  return value;
}

/** ورود با رمز فقط برای ریدایرکت به پنل وکیل یا ادمین. */
export function isPasswordPanelPath(value?: string | null) {
  const path = safeInternalPath(value);
  if (!path) return false;
  return path === "/lawyer" || path.startsWith("/lawyer/") || path === "/admin" || path.startsWith("/admin/");
}
