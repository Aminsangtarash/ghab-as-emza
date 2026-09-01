"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[40vh] w-full max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-heading text-2xl font-bold text-navy">خطایی رخ داد</h1>
      <p className="mt-3 text-sm text-navy/70">لطفاً دوباره تلاش کنید.</p>
      <Button className="mt-6 h-11 bg-navy text-white hover:bg-navy-mid" onClick={reset}>
        تلاش مجدد
      </Button>
    </section>
  );
}
