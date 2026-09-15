export type CatalogIcon =
  | "consult"
  | "petitions"
  | "contracts"
  | "family"
  | "property"
  | "criminal"
  | "inheritance"
  | "companies"
  | "labor"
  | "registry"
  | "arbitration"
  | "cases";

export type CatalogItem = {
  slug: string;
  title: string;
  short: string;
  learnCategory?: string;
};

export type CatalogGroup = {
  title: string;
  items: CatalogItem[];
};

export type CatalogCategory = {
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: CatalogIcon;
  href: string;
  groups: CatalogGroup[];
};

function items(entries: Array<[string, string, string?, string?]>): CatalogItem[] {
  return entries.map(([slug, title, short, learnCategory]) => ({
    slug,
    title,
    short: short ?? "ثبت درخواست بررسی این موضوع توسط کارشناسان مجموعه.",
    learnCategory,
  }));
}

export const catalogCategories: CatalogCategory[] = [
  {
    slug: "consultation",
    title: "مشاوره حقوقی",
    short: "مشاوره تلفنی، متنی، تصویری، حضوری یا فوری در همه حوزه‌های حقوقی.",
    description:
      "موضوع را انتخاب کنید و درخواست بگذارید. مدیر سیستم آن را بررسی می‌کند و به وکیل مناسب می‌سپارد.",
    icon: "consult",
    href: "/services/consultation",
    groups: [
      {
        title: "نحوه مشاوره",
        items: items([
          ["consult-text", "مشاوره حقوقی متنی (چت)", "شرح موضوع را بنویسید؛ پاسخ در پنل ثبت می‌شود."],
          ["consult-phone", "مشاوره حقوقی تلفنی", "هماهنگی تماس پس از بررسی مدیر انجام می‌شود."],
          ["consult-video", "مشاوره تصویری آنلاین", "جلسه تصویری پس از تأیید مدیر برگزار می‌شود."],
          ["consult-in-person", "مشاوره حضوری با رزرو نوبت", "زمان حضور در دفتر پس از تخصیص وکیل هماهنگ می‌شود."],
          ["consult-urgent", "مشاوره فوری / اورژانسی", "موضوع فوری را ثبت کنید؛ مدیر در اولویت بررسی می‌کند."],
        ]),
      },
      {
        title: "حوزه مشاوره",
        items: items([
          ["consult-civil", "حقوقی", undefined, "contracts"],
          ["consult-criminal-area", "کیفری", undefined, "criminal"],
          ["consult-family-area", "خانواده", undefined, "family"],
          ["consult-property-area", "ملکی", undefined, "property"],
          ["consult-registry-area", "ثبتی", undefined, "registry"],
          ["consult-contracts-area", "قراردادها", undefined, "contracts"],
          ["consult-labor-area", "کار و تامین اجتماعی", undefined, "labor"],
          ["consult-companies-area", "شرکت‌ها و امور تجاری", undefined, "companies"],
          ["consult-inheritance-area", "ارث و وصیت", undefined, "inheritance"],
          ["consult-admin-court", "دیوان عدالت اداری"],
        ]),
      },
    ],
  },
  {
    slug: "petitions",
    title: "تنظیم دادخواست و شکواییه",
    short: "تنظیم و بررسی اوراق قضایی بر اساس شرح ماجرا و مدارک شما.",
    description:
      "متن خام یا شرح ماجرا را بفرستید. پس از بررسی مدیر، وکیل متن را تنظیم می‌کند و نتیجه پس از تأیید مدیر به شما می‌رسد.",
    icon: "petitions",
    href: "/services/petitions",
    groups: [
      {
        title: "اوراق قضایی",
        items: items([
          ["petition-dadkhast", "تنظیم دادخواست"],
          ["petition-shekayat", "تنظیم شکواییه"],
          ["petition-layehe", "تنظیم لایحه دفاعیه"],
          ["petition-ezharname", "تنظیم اظهارنامه"],
          ["petition-ejraeiye", "تنظیم درخواست اجرائیه"],
          ["petition-etraz", "تنظیم اعتراض، تجدیدنظر، واخواهی، فرجام‌خواهی"],
          ["petition-esar", "تنظیم اعسار و تقسیط محکوم‌به"],
          ["petition-tamin-dalil", "تنظیم تامین دلیل"],
          ["petition-dastor-movaghat", "تنظیم درخواست دستور موقت"],
        ]),
      },
    ],
  },
  {
    slug: "contracts",
    title: "قراردادها",
    short: "تنظیم اختصاصی، بررسی، ارزیابی ریسک و نمونه قراردادهای آماده.",
    description:
      "قرارداد را قبل از امضا بررسی کنید یا تنظیم اختصاصی بخواهید. خروجی پس از تأیید مدیر تحویل می‌شود.",
    icon: "contracts",
    href: "/services/contracts",
    groups: [
      {
        title: "خدمات قرارداد",
        items: items([
          ["contract-custom", "تنظیم قرارداد اختصاصی", undefined, "contracts"],
          ["contract-review", "بررسی و اصلاح قرارداد", undefined, "contracts"],
          ["contract-risk", "ارزیابی ریسک حقوقی قرارداد", undefined, "contracts"],
          ["contract-interpret", "تفسیر بندهای مبهم قرارداد", undefined, "contracts"],
          ["contract-templates", "تهیه نمونه قراردادهای آماده", undefined, "contracts"],
        ]),
      },
      {
        title: "نمونه قراردادها",
        items: items([
          ["template-ejare", "اجاره"],
          ["template-buy", "خرید و فروش"],
          ["template-mosharekat", "مشارکت"],
          ["template-peymankari", "پیمانکاری"],
          ["template-estekhdam", "استخدام"],
          ["template-jaale", "جعاله"],
          ["template-solh", "صلح"],
          ["template-gharz", "قرض"],
          ["template-investment", "سرمایه‌گذاری"],
          ["template-cooperation", "همکاری تجاری"],
          ["template-startup", "قراردادهای استارتاپی"],
        ]),
      },
    ],
  },
  {
    slug: "family",
    title: "خدمات خانواده",
    short: "طلاق، مهریه، نفقه، حضانت و سایر دعاوی خانواده.",
    description: "موضوع خانوادگی را انتخاب کنید تا مسیر بررسی و اقدام مشخص شود.",
    icon: "family",
    href: "/services/family",
    groups: [
      {
        title: "دعاوی خانواده",
        items: items([
          ["family-talagh-tavofoghi", "طلاق توافقی", undefined, "family"],
          ["family-talagh-yektarafe", "طلاق یک‌طرفه", undefined, "family"],
          ["family-mahriye", "مطالبه مهریه", undefined, "family"],
          ["family-nafaqa", "مطالبه نفقه", undefined, "family"],
          ["family-hezanat", "حضانت فرزند", undefined, "family"],
          ["family-molaghat", "ملاقات فرزند", undefined, "family"],
          ["family-tamkin", "تمکین", undefined, "family"],
          ["family-jahiziye", "استرداد جهیزیه", undefined, "family"],
          ["family-ezbat-zowjiyat", "اثبات زوجیت", undefined, "family"],
          ["family-faskh-nekah", "فسخ نکاح", undefined, "family"],
        ]),
      },
    ],
  },
  {
    slug: "property",
    title: "خدمات ملکی",
    short: "تخلیه، خلع ید، سند، اجاره و اختلافات ملکی.",
    description: "موضوع ملکی را انتخاب کنید؛ مدارک سند و قرارداد را بعداً می‌توانید بفرستید.",
    icon: "property",
    href: "/services/property",
    groups: [
      {
        title: "دعاوی ملکی",
        items: items([
          ["property-elzam-sanad", "الزام به تنظیم سند رسمی", undefined, "property"],
          ["property-takhliye", "تخلیه ملک", undefined, "property"],
          ["property-ojratolmesl", "مطالبه اجرت‌المثل", undefined, "property"],
          ["property-khale-yad", "خلع ید", undefined, "property"],
          ["property-tasarof", "رفع تصرف عدوانی", undefined, "property"],
          ["property-afraz", "افراز و تقسیم ملک", undefined, "property"],
          ["property-tahvil", "الزام به تحویل ملک", undefined, "property"],
          ["property-pishforoush", "دعاوی پیش‌فروش", undefined, "property"],
          ["property-mojer-mostajer", "اختلافات موجر و مستأجر", undefined, "property"],
          ["property-sanad-sabti", "بررسی اسناد و وضعیت ثبتی ملک", undefined, "property"],
        ]),
      },
    ],
  },
  {
    slug: "criminal",
    title: "خدمات کیفری",
    short: "شکواییه، جرایم مالی و دفاع در دادسرا و دادگاه.",
    description: "موضوع کیفری را با شرح کوتاه ثبت کنید. پیگیری فقط پس از بررسی مدیر آغاز می‌شود.",
    icon: "criminal",
    href: "/services/criminal",
    groups: [
      {
        title: "امور کیفری",
        items: items([
          ["criminal-shekayat", "تنظیم شکواییه کیفری", undefined, "criminal"],
          ["criminal-mali", "مشاوره در جرایم مالی", undefined, "criminal"],
          ["criminal-kolahbardari", "کلاهبرداری", undefined, "criminal"],
          ["criminal-khianat", "خیانت در امانت", undefined, "criminal"],
          ["criminal-jaal", "جعل و استفاده از سند مجعول", undefined, "criminal"],
          ["criminal-serghat", "سرقت", undefined, "criminal"],
          ["criminal-zarb", "ضرب و جرح", undefined, "criminal"],
          ["criminal-tahdid", "تهدید و توهین", undefined, "criminal"],
          ["criminal-cyber", "جرایم رایانه‌ای", undefined, "criminal"],
          ["criminal-defa", "دفاع در مرحله دادسرا و دادگاه", undefined, "criminal"],
        ]),
      },
    ],
  },
  {
    slug: "inheritance",
    title: "ارث و انحصار وراثت",
    short: "انحصار وراثت، تقسیم ترکه، وصیت‌نامه و اختلاف وراث.",
    description: "مدارک هویتی و نسبت وراث را بعد از ثبت درخواست بارگذاری کنید.",
    icon: "inheritance",
    href: "/services/inheritance",
    groups: [
      {
        title: "امور ارث",
        items: items([
          ["inherit-enhesar", "درخواست انحصار وراثت", undefined, "inheritance"],
          ["inherit-taghsim", "تقسیم ترکه", undefined, "inheritance"],
          ["inherit-tahrir", "تحریر ترکه", undefined, "inheritance"],
          ["inherit-sahm", "مطالبه سهم‌الارث", undefined, "inheritance"],
          ["inherit-tanfiz", "تنفیذ وصیت‌نامه", undefined, "inheritance"],
          ["inherit-ebtal-vasiat", "ابطال یا بررسی وصیت‌نامه", undefined, "inheritance"],
          ["inherit-ekhtelaf", "مشاوره در اختلافات بین وراث", undefined, "inheritance"],
        ]),
      },
    ],
  },
  {
    slug: "companies",
    title: "ثبت شرکت و برند",
    short: "ثبت شرکت، تغییرات، برند، اساسنامه و مشاوره کسب‌وکار.",
    description: "نوع اقدام ثبتی یا شرکتی را انتخاب کنید تا پرونده اداری تشکیل شود.",
    icon: "companies",
    href: "/services/companies",
    groups: [
      {
        title: "امور شرکت‌ها",
        items: items([
          ["company-register", "ثبت شرکت", undefined, "companies"],
          ["company-changes", "ثبت تغییرات شرکت", undefined, "companies"],
          ["company-sooratjalase", "تنظیم صورت‌جلسه", undefined, "companies"],
          ["company-brand", "ثبت برند", undefined, "companies"],
          ["company-institute", "ثبت موسسه", undefined, "companies"],
          ["company-economic-code", "اخذ کد اقتصادی", undefined, "companies"],
          ["company-asasname", "تنظیم اساسنامه", undefined, "companies"],
          ["company-internal-contracts", "تنظیم قراردادهای داخلی شرکت", undefined, "companies"],
          ["company-business-consult", "مشاوره حقوقی کسب‌وکار", undefined, "companies"],
        ]),
      },
    ],
  },
  {
    slug: "labor",
    title: "کار و تامین اجتماعی",
    short: "حقوق و مزایا، اخراج، بیمه، سنوات و هیأت تشخیص.",
    description: "موضوع رابطه کار را ثبت کنید تا مسیر اداره کار یا تامین اجتماعی مشخص شود.",
    icon: "labor",
    href: "/services/labor",
    groups: [
      {
        title: "امور کار",
        items: items([
          ["labor-hoghoogh", "مطالبه حقوق و مزایا", undefined, "labor"],
          ["labor-shekayat", "شکایت از کارفرما", undefined, "labor"],
          ["labor-contract-review", "بررسی قرارداد کار", undefined, "labor"],
          ["labor-ekhraj", "اخراج غیرقانونی", undefined, "labor"],
          ["labor-sanavat", "سنوات و عیدی", undefined, "labor"],
          ["labor-bime", "بیمه و سوابق تامین اجتماعی", undefined, "labor"],
          ["labor-hadese", "حوادث ناشی از کار", undefined, "labor"],
          ["labor-heyate", "مشاوره هیأت تشخیص و حل اختلاف", undefined, "labor"],
        ]),
      },
    ],
  },
  {
    slug: "registry",
    title: "خدمات ثبتی و اسناد",
    short: "بررسی سند، اصلاح، افراز، استعلام و اقرارنامه.",
    description: "مشکل ثبتی یا سندی را انتخاب کنید تا مسیر استعلام و اقدام مشخص شود.",
    icon: "registry",
    href: "/services/registry",
    groups: [
      {
        title: "امور ثبتی",
        items: items([
          ["registry-review-docs", "بررسی اسناد رسمی و عادی", undefined, "registry"],
          ["registry-eslah-sanad", "اصلاح سند", undefined, "registry"],
          ["registry-problems", "پیگیری مشکلات ثبتی", undefined, "registry"],
          ["registry-ebtal-sanad", "ابطال سند", undefined, "registry"],
          ["registry-tafkik", "تفکیک و افراز", undefined, "registry"],
          ["registry-estelam", "استعلام‌های ثبتی", undefined, "registry"],
          ["registry-eghrarname", "تنظیم اقرارنامه و تعهدنامه", undefined, "registry"],
        ]),
      },
    ],
  },
  {
    slug: "arbitration",
    title: "داوری و میانجی‌گری",
    short: "حل اختلاف بدون دادگاه: داوری، سازش و جلسه آنلاین.",
    description: "اگر می‌خواهید اختلاف را خارج از دادگاه حل کنید، نوع مسیر را انتخاب کنید.",
    icon: "arbitration",
    href: "/services/arbitration",
    groups: [
      {
        title: "حل اختلاف",
        items: items([
          ["arb-contractual", "داوری قراردادی"],
          ["arb-mediation", "میانجی‌گری"],
          ["arb-sazesh", "سازش‌نامه"],
          ["arb-online", "جلسه حل اختلاف آنلاین"],
          ["arb-clause", "تنظیم شرط داوری در قراردادها"],
        ]),
      },
    ],
  },
  {
    slug: "case-tracking",
    title: "پیگیری پرونده",
    short: "ثبت پرونده، مدارک، مراحل رسیدگی و ارتباط با وکیل پرونده.",
    description:
      "اطلاعات پرونده را ثبت کنید. هر مرحله پس از بررسی مدیر در پنل شما دیده می‌شود و پس از پایان، مدارک حذف می‌شود.",
    icon: "cases",
    href: "/services/case-tracking",
    groups: [
      {
        title: "امکانات پیگیری",
        items: items([
          ["case-register", "ثبت اطلاعات پرونده"],
          ["case-docs", "بارگذاری مدارک"],
          ["case-stages", "مشاهده مراحل رسیدگی"],
          ["case-hearings", "یادآوری تاریخ جلسات"],
          ["case-deadlines", "یادآوری مهلت اعتراض و تجدیدنظر"],
          ["case-lawyer", "ارتباط با وکیل پرونده"],
          ["case-archive", "آرشیو اسناد و مکاتبات"],
        ]),
      },
    ],
  },
];

export const catalogCategoryMap = Object.fromEntries(
  catalogCategories.map((item) => [item.slug, item]),
) as Record<string, CatalogCategory>;

export function allCatalogItems() {
  return catalogCategories.flatMap((category) =>
    category.groups.flatMap((group) =>
      group.items.map((item) => ({ ...item, categorySlug: category.slug, categoryTitle: category.title })),
    ),
  );
}

export function getCatalogCategory(slug: string) {
  return catalogCategories.find((item) => item.slug === slug);
}

export function getCatalogItem(slug: string) {
  return allCatalogItems().find((item) => item.slug === slug);
}

export function catalogItemTitle(slug: string) {
  return getCatalogItem(slug)?.title ?? getCatalogCategory(slug)?.title ?? slug;
}

export function servicePath(categorySlug: string, itemSlug?: string) {
  return itemSlug ? `/services/${categorySlug}/${itemSlug}` : `/services/${categorySlug}`;
}
