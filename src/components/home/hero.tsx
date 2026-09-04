"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { ShieldCheckIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useParallax } from "@/hooks/use-parallax";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const { x, y, scrollY } = useParallax(!reducedMotion);
  const heroRef = useRef<HTMLElement>(null);
  const [heroHeight, setHeroHeight] = useState(0);

  const bgTransform = reducedMotion
    ? undefined
    : `translate3d(${x * 0.45}px, ${y * 0.25 + scrollY * 0.147}px, 0) scale(1.06)`;

  useLayoutEffect(() => {
    const node = heroRef.current;
    if (!node) return;

    const update = () => setHeroHeight(node.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-0 hidden overflow-hidden bg-navy-deep md:block"
        style={{ height: heroHeight || "34rem" }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-3 h-full origin-top-left lg:left-[max(0.75rem,calc((100%-72rem)/4+0.75rem))]"
          style={{ transform: bgTransform }}
        >
          <div className="relative h-full w-fit">
            <Image
              src="/images/hero-legal.jpg"
              alt=""
              width={2000}
              height={1333}
              priority
              className="h-full w-auto max-w-none"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, #000 22%, #000 40%, rgba(0,0,0,0.4) 62%, transparent 96%)",
                maskImage:
                  "linear-gradient(to right, transparent 0%, #000 22%, #000 40%, rgba(0,0,0,0.4) 62%, transparent 96%)",
              }}
            />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-navy-deep to-transparent" />
          </div>
        </div>
        <div className="absolute inset-y-0 left-0 w-[15%] bg-gradient-to-r from-navy-deep from-15% to-transparent lg:w-[min(15%,15rem)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent from-[8%] via-navy-deep/40 via-[42%] to-navy-deep to-[72%]" />
      </div>

      <section ref={heroRef} className="relative z-10 bg-navy-deep md:bg-transparent">
        <div className="relative mx-auto flex min-h-[30rem] w-full max-w-6xl items-center px-4 pt-16 pb-14 sm:min-h-[34rem] sm:px-6 sm:pt-20 sm:pb-16">
          <div className="w-full max-w-2xl">
            <p
              className="hero-animate mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-gold/45 bg-white/8 px-4 py-1.5 text-xs font-medium text-gold backdrop-blur-sm"
              style={{ animationDelay: "120ms" }}
            >
              <ShieldCheckIcon className="size-3.5 shrink-0" />
              امنیت اطلاعات و کیفیت کارشناسی، اولویت ماست
            </p>

            <h1
              className="hero-animate font-heading text-4xl font-bold leading-snug text-white sm:text-[2.6rem] sm:leading-snug"
              style={{ animationDelay: "260ms" }}
            >
              قبل از هر امضا
              <span className="mt-1 block text-gold">یک تصمیم آگاهانه بگیرید</span>
            </h1>

            <p
              className="hero-animate mt-4 max-w-xl text-sm leading-7 text-white/82 sm:text-base sm:leading-8"
              style={{ animationDelay: "420ms" }}
            >
              مشاوره حقوقی تخصصی برای قراردادها، اسناد و پرونده‌ها؛ با همراهی وکلای مجرب و مسیر امن برای تبادل اطلاعات.
            </p>

            <div
              className="hero-animate mt-7 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "580ms" }}
            >
              <Link
                href="/consult"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 bg-gold px-6 text-sm text-navy-deep hover:bg-gold sm:h-12 sm:px-7 sm:text-base",
                )}
              >
                مشاوره آنلاین
              </Link>
              <a
                href="#services"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-white/35 bg-white/5 px-6 text-sm text-white backdrop-blur-sm hover:bg-white/12 hover:text-white sm:h-12 sm:px-7 sm:text-base",
                )}
              >
                مشاهده خدمات
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
