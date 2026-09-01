import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-heading text-5xl font-bold text-gold">۴۰۴</p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-navy">صفحه پیدا نشد</h1>
      <p className="mt-3 text-sm leading-7 text-navy/70">
        نشانی واردشده وجود ندارد یا جابه‌جا شده است.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-6 h-11 bg-navy px-6 text-white hover:bg-navy-mid")}>
        بازگشت به خانه
      </Link>
    </section>
  );
}
