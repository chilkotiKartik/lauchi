"use client";
import { useEffect, useRef } from "react";

/** A row of filter chips: wraps on wide screens, swipes sideways on phones. The selected chip (aria-pressed or
 * aria-current) is scrolled to the middle so it is never hidden off the edge. */
export function ChipRow({ label, active, children }: { label: string; active?: string | number | null; children: React.ReactNode }) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = nav.current;
    const on = el?.querySelector<HTMLElement>('[aria-pressed="true"],[aria-current="true"]');
    if (!el || !on || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: on.offsetLeft - el.offsetLeft - (el.clientWidth - on.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);
  return (
    <nav ref={nav} aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {children}
    </nav>
  );
}
