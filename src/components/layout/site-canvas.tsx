"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function SiteViewport({ children }: { children: React.ReactNode }) {
  return <div className="h-dvh overflow-hidden bg-white p-2.5 md:p-3">{children}</div>;
}

export function GoldCanvas({
  children,
  className,
  fill = false,
}: {
  children: React.ReactNode;
  className?: string;
  fill?: boolean;
}) {
  const scrollerId = useId();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef({ top: 0, height: 0, needed: false, value: 0 });
  const dragRef = useRef<{ pointerId: number; startY: number; startTop: number; ratio: number } | null>(null);
  const hoveringRef = useRef(false);
  const hideTimer = useRef(0);
  const [metrics, setMetrics] = useState({ top: 0, height: 0, needed: false, value: 0 });
  const [active, setActive] = useState(false);
  const [thick, setThick] = useState(false);

  const sync = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const { scrollTop, scrollHeight, clientHeight } = node;
    const needed = scrollHeight > clientHeight + 2;
    const inset = 12;
    const track = Math.max(clientHeight - inset * 2, 0);
    const height = needed ? Math.max((clientHeight / scrollHeight) * track, 36) : 0;
    const max = Math.max(scrollHeight - clientHeight, 1);
    const next = {
      top: needed ? inset + (scrollTop / max) * (track - height) : 0,
      height,
      needed,
      value: Math.round((scrollTop / max) * 100),
    };
    metricsRef.current = next;
    setMetrics(next);
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    const frame = () => sync();
    frame();

    const observer = new ResizeObserver(frame);
    observer.observe(node);
    const mutations = new MutationObserver(frame);
    mutations.observe(node, { childList: true, subtree: true, characterData: true });

    window.addEventListener("resize", frame);
    node.addEventListener("load", frame, true);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", frame);
      node.removeEventListener("load", frame, true);
    };
  }, [sync]);

  function reveal() {
    window.clearTimeout(hideTimer.current);
    setActive(true);
  }

  function conceal() {
    if (dragRef.current || hoveringRef.current) return;
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setActive(false);
      setThick(false);
    }, 700);
  }

  function onScrollerScroll() {
    sync();
    reveal();
    conceal();
  }

  function onThumbPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    const node = scrollerRef.current;
    if (!node) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const travel = Math.max(node.clientHeight - 24 - metricsRef.current.height, 1);
    const max = Math.max(node.scrollHeight - node.clientHeight, 1);
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTop: node.scrollTop,
      ratio: max / travel,
    };
    setThick(true);
    reveal();
  }

  function onThumbPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const node = scrollerRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !node) return;
    node.scrollTop = drag.startTop + (event.clientY - drag.startY) * drag.ratio;
  }

  function onThumbPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    conceal();
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-[1.6rem] bg-gold-wash", fill ? "h-full" : "min-h-0 flex-1")}
      onMouseEnter={() => {
        hoveringRef.current = true;
        reveal();
      }}
      onMouseLeave={() => {
        hoveringRef.current = false;
        conceal();
      }}
    >
      <div
        ref={scrollerRef}
        id={scrollerId}
        data-site-canvas=""
        onScroll={onScrollerScroll}
        className={cn(
          "no-scrollbar h-full overflow-x-hidden overflow-y-auto overscroll-contain",
          className,
        )}
      >
        {children}
      </div>
      {metrics.needed ? (
        <button
          type="button"
          role="scrollbar"
          aria-controls={scrollerId}
          aria-label="پیمایش صفحه"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={metrics.value}
          tabIndex={-1}
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={onThumbPointerUp}
          onPointerCancel={onThumbPointerUp}
          onMouseEnter={() => setThick(true)}
          onMouseLeave={() => {
            if (!dragRef.current) setThick(false);
          }}
          className={cn(
            "absolute end-0 z-20 flex touch-none justify-center bg-transparent p-0 transition-opacity duration-150",
            active || thick ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
            thick ? "w-3.5" : "w-3",
          )}
          style={{ top: metrics.top, height: metrics.height }}
        >
          <span
            className={cn(
              "block h-full rounded-full transition-[width,background-color] duration-150",
              thick ? "w-1.5 bg-navy/50" : "w-1 bg-navy/30",
            )}
          />
        </button>
      ) : null}
    </div>
  );
}
