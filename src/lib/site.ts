export const site = {
  name: "قبل از امضا",
  tagline: "مشاوره و خدمات حقوقی",
  description:
    "مرجع خدمات حقوقی آنلاین؛ از آموزش ساده تا ثبت درخواست، تخصیص وکیل توسط مدیر و پیگیری پرونده.",
  url: "https://ghablazemza.ir",
  email: "info@ghablazemza.ir",
  phone: "۰۲۱-۹۱۰۰۹۱۰۰",
  phoneRaw: "02191009100",
  address: "تهران، خیابان ولیعصر، بالاتر از میدان ونک",
  hours: "شنبه تا چهارشنبه ۹ تا ۱۸ | پنجشنبه ۹ تا ۱۴",
  social: {
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
    telegram: "https://t.me",
  },
} as const;

export const navItems = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/services", label: "خدمات حقوقی" },
  { href: "/articles", label: "مقالات" },
  { href: "/learn", label: "مرکز آموزش" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
] as const;
