import { toFaDigits } from "@/lib/format";
import { site } from "@/lib/site";
import type { PublicUser } from "@/lib/store";

export function AccountProfile({ user }: { user: PublicUser }) {
  return (
    <div>
      <p className="text-sm font-medium text-gold-deep">حساب</p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-navy">حساب کاربری</h1>
      <p className="mt-2 max-w-xl text-sm leading-7 text-navy/65">
        این اطلاعات هنگام ثبت درخواست استفاده می‌شود. ویرایش کامل پس از اتصال پایگاه داده فعال می‌شود.
      </p>

      <dl className="mt-8 grid max-w-xl gap-3">
        <div className="rounded-2xl bg-paper px-4 py-3">
          <dt className="text-xs font-medium text-navy/50">نام و نام خانوادگی</dt>
          <dd className="mt-1 text-sm text-navy">{user.fullName}</dd>
        </div>
        <div className="rounded-2xl bg-paper px-4 py-3">
          <dt className="text-xs font-medium text-navy/50">شماره موبایل</dt>
          <dd className="mt-1 text-sm text-navy" dir="ltr">
            {toFaDigits(user.phone)}
          </dd>
        </div>
        <div className="rounded-2xl bg-paper px-4 py-3">
          <dt className="text-xs font-medium text-navy/50">ساعات پاسخگویی</dt>
          <dd className="mt-1 text-sm text-navy">{site.hours}</dd>
        </div>
      </dl>
    </div>
  );
}
