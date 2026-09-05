"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * Mobile drawer — slides in from the physical right edge.
 * Portaled to document.body so sticky/blur ancestors don't clip it.
 * Backdrop click and Escape close it.
 */
export function PanelMobileDrawer({
  open,
  onClose,
  children,
  className,
  /** Hide the drawer chrome from this breakpoint up, e.g. `xl:hidden` or `lg:hidden`. */
  hideFromClassName = "xl:hidden",
  widthClassName = "w-[min(20rem,88vw)]",
  ariaLabel = "منوی موبایل",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  hideFromClassName?: string;
  widthClassName?: string;
  ariaLabel?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={hideFromClassName} aria-hidden={!open}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="بستن منو"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[60] bg-navy-deep/55 backdrop-blur-[3px] transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          "fixed inset-y-0 right-0 z-[70] flex h-dvh max-h-dvh flex-col overflow-hidden",
          "rounded-s-[1.5rem] shadow-[-12px_0_40px_rgba(8,22,40,0.35)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          widthClassName,
          open ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        {children}
      </aside>
    </div>,
    document.body,
  );
}
