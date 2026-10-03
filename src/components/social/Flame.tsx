"use client";
import { motion } from "framer-motion";

/** A flickering streak flame. Grey and still when the streak is 0; still for reduced motion. */
export function Flame({ count, size = 44, label }: { count: number; size?: number; label?: string }) {
  const lit = count > 0;
  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={label ?? `${count} day streak`}>
      <motion.svg viewBox="0 0 48 48" width={size} height={size} aria-hidden style={{ overflow: "visible", transformOrigin: "50% 90%" }}
        animate={lit ? { scaleY: [1, 1.07, 0.97, 1.04, 1], rotate: [0, -2, 1.5, -1, 0] } : undefined}
        transition={lit ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}>
        {lit && <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="rgba(255,154,31,.25)" />}
        <path d={"M24 3c2 8 12 11 12 24a12 12 0 0 1-24 0c0-6 3-9 6-12 .5 4 2 6 4 7C22 16 22 9 24 3z"} fill={lit ? "#ff9a1f" : "var(--line2)"} />
        <motion.path d="M24 25c3.5 3.4 6 5.3 6 9.2a6 6 0 0 1-12 0c0-3.2 2.2-5.8 6-9.2z" fill={lit ? "#ffc83d" : "var(--line)"}
          style={{ transformOrigin: "50% 100%" }}
          animate={lit ? { scale: [1, 1.15, 0.92, 1.08, 1] } : undefined}
          transition={lit ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : undefined} />
      </motion.svg>
      <span aria-hidden className={`font-black tabular-nums ${lit ? "text-head" : "text-muted"}`} style={{ fontSize: Math.max(14, size * 0.42) }}>{count}</span>
    </span>
  );
}
