"use client";

import { useEffect, useState } from "react";

type ParallaxOffset = {
  x: number;
  y: number;
  scrollY: number;
};

export function useParallax(enabled: boolean) {
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0, scrollY: 0 });

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let scrollY = 0;

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setOffset({ x: currentX, y: currentY, scrollY });
      frame = requestAnimationFrame(animate);
    };

    const onMove = (event: MouseEvent) => {
      const ratioX = event.clientX / window.innerWidth - 0.5;
      const ratioY = event.clientY / window.innerHeight - 0.5;
      targetX = ratioX * 28;
      targetY = ratioY * 18;
    };

    const canvas = document.querySelector("[data-site-canvas]");

    const onScroll = () => {
      scrollY = canvas instanceof HTMLElement ? canvas.scrollTop : window.scrollY;
    };

    frame = requestAnimationFrame(animate);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    canvas?.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      canvas?.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);

  return offset;
}
