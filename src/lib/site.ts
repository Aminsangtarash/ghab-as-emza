export const site = {
  name: "قبل از امضا",
  tagline: "مشاوره و خدمات حقوقی",
  description:
    "مشاوره حقوقی تخصصی برای قراردادها، اسناد و پرونده‌ها؛ با اولویت امنیت اطلاعات و کیفیت کارشناسی.",
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
  { href: "/lawyers", label: "وکلا و متخصصان" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
] as const;
