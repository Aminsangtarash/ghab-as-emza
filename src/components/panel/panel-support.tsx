import { ContactContent } from "@/components/contact/contact-content";
import { PanelHeading } from "@/components/panel/panel-heading";
import { site } from "@/lib/site";

export function PanelSupport({ consultHref }: { consultHref: string }) {
  return (
    <div>
      <PanelHeading
        kicker="ارتباط با دفتر"
        title="پشتیبانی"
        description={`پیام اداری، پیگیری هماهنگی و سؤال درباره پنل را از این صفحه بفرستید. ساعات پاسخگویی: ${site.hours}. موضوع حقوقی را از مسیر مشاوره ثبت کنید.`}
      />
      <div className="mt-8">
        <ContactContent embedded consultHref={consultHref} />
      </div>
    </div>
  );
}
