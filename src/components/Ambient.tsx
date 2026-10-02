"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefs } from "@/lib/prefs";
import { sayReaction, sfx } from "@/lib/voice";
import { Lochi } from "@/components/Lochi";
import { Confetti } from "@/components/motion";

/** Slow-moving colour blobs behind every app page. Pure CSS transforms; frozen for reduced motion or "calm" mode. */
export function Ambient() {
  const [prefs] = usePrefs();
  useEffect(() => { document.documentElement.dataset.motion = prefs.motion; }, [prefs.motion]);
  return <div className="aurora" aria-hidden><i /><i /><i /><i /></div>;
}

const KEY = "lockin.lastLevel";
/** Celebrates a new level the first time the student sees a page after reaching it. */
export function LevelWatcher({ level }: { level: number }) {
  const [show, setShow] = useState<number | null>(null);
  useEffect(() => {
    let prev: number | null = null;
    try { const v = localStorage.getItem(KEY); prev = v ? Number(v) : null; localStorage.setItem(KEY, String(level)); } catch { return; }
    if (prev !== null && Number.isFinite(prev) && level > prev) {
      const t = setTimeout(() => { setShow(level); sfx("levelup"); sayReaction("levelup"); }, 400);
      return () => clearTimeout(t);
    }
  }, [level]);
  useEffect(() => {
    if (show === null) return;
    const t = setTimeout(() => setShow(null), 7000);
    return () => clearTimeout(t);
  }, [show]);
  return (
    <AnimatePresence>
      {show !== null && (
        <motion.div className="levelup" role="status" aria-live="polite" aria-labelledby="lvl-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Confetti pieces={40} />
          <span className="levelup-rays" aria-hidden />
          <motion.div className="levelup-card relative" initial={{ scale: 0.6, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
            <Lochi mood="levelup" size={120} />
            <p className="text-xs font-black uppercase tracking-widest text-muted">Level up</p>
            <h2 id="lvl-title" className="text-4xl">Level {show}!</h2>
            <p>Every level is proof you kept showing up. The next one is closer than it looks.</p>
            <button type="button" className="btn btn-wide" onClick={() => setShow(null)}>Keep going</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
