"use client";
import { motion, useReducedMotion } from "framer-motion";
import { formatClock } from "@/lib/paper";

/** The big exam clock: an animated ring that drains as time runs out, turning amber then red near the end. */
export function CountdownRing({ left, total, paused, size = 168 }: { left: number; total: number; paused: boolean; size?: number }) {
  const reduce = useReducedMotion();
  const r = 70, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, total > 0 ? left / total : 0));
  const color = left <= 10 * 60_000 ? "var(--red)" : left <= 30 * 60_000 ? "var(--orange)" : "var(--green)";
  const text = formatClock(left);
  return (
    <div className="pp-ring relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 168 168" width={size} height={size} aria-hidden>
        <circle cx="84" cy="84" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="12" />
        <motion.circle cx="84" cy="84" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={c}
          transform="rotate(-90 84 84)" initial={false} animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: reduce ? 0 : 0.9, ease: "linear" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="pp-clock font-black tabular-nums" role="timer" aria-label={`Time left ${text}${paused ? ", paused" : ""}`}>{text}</div>
          <div className="text-xs font-black uppercase tracking-widest opacity-80">{paused ? "Paused" : "Time left"}</div>
        </div>
      </div>
    </div>
  );
}
