"use client";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type Variants } from "framer-motion";
import { useEffect, type CSSProperties, type ReactNode } from "react";

/** Fades and rises into view once. With reduced motion it simply appears. */
export function Reveal({ children, delay = 0, className, y = 14 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.42, delay, ease: [0.2, 0.9, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.055 } } };
const item: Variants = { hidden: { opacity: 0, y: 16, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.36, ease: [0.2, 0.9, 0.3, 1] } } };

/** A list or grid whose children pop in one after another. Use `as="ul"` for lists. */
export function Stagger({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const Tag = motion[as] as typeof motion.div;
  return <Tag className={className} variants={list} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -6% 0px" }}>{children}</Tag>;
}
export function StaggerItem({ children, className, style, as = "div" }: { children: ReactNode; className?: string; style?: CSSProperties; as?: "div" | "li" }) {
  const Tag = motion[as] as typeof motion.div;
  return <Tag className={className} style={style} variants={item}>{children}</Tag>;
}

/** Counts up to a number. The real value is what the server renders; the count-up starts a little below it. */
export function CountUp({ value, duration = 0.9 }: { value: number; duration?: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const shown = useTransform(mv, (v) => Math.round(v).toLocaleString("en-IN"));
  useEffect(() => {
    if (reduce) { mv.set(value); return; }
    mv.jump(Math.max(0, value * 0.6));
    const c = animate(mv, value, { duration, ease: [0.2, 0.9, 0.3, 1] });
    return () => c.stop();
  }, [value, duration, reduce, mv]);
  return <motion.span>{shown}</motion.span>;
}

const COLORS = ["#44c95a", "#2ba6f5", "#ffc83d", "#ff5a5f", "#a970ff", "#ff9a1f"];
/** A one-off burst of paper for a win. Pure CSS animation, pointer-events none, hidden for reduced motion. */
export function Confetti({ pieces = 28 }: { pieces?: number }) {
  return (
    <div aria-hidden className="confetti pointer-events-none fixed inset-x-0 top-0 z-30 h-dvh overflow-hidden">
      {Array.from({ length: pieces }, (_, i) => {
        const left = (i * 37) % 100, delay = (i % 7) * 0.06, dur = 1.6 + ((i * 13) % 9) / 10, rot = (i * 53) % 360;
        return <i key={i} style={{ left: `${left}%`, background: COLORS[i % COLORS.length], animationDelay: `${delay}s`, animationDuration: `${dur}s`, ["--r" as string]: `${rot}deg`, ["--dx" as string]: `${((i % 5) - 2) * 26}px` }} />;
      })}
    </div>
  );
}
