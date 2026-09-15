import { ShieldCheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function PrivacyPromise({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-navy/10 bg-navy/[0.03] px-4 py-3 text-sm leading-7 text-navy/70",
        className,
      )}
    >
      <p className="flex items-start gap-2 font-medium text-navy">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-gold-deep" />
        مدارک شما در این سامانه ماندگار نیست
      </p>
      <p className="mt-1">
        پس از تأیید پایان پرونده توسط مدیر، فایل‌های بارگذاری‌شده از سامانه حذف می‌شوند و برای پیگیری بعدی در اختیار
        مجموعه باقی نمی‌مانند.
      </p>
    </div>
  );
}
