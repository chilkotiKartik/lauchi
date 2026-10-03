"use client";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";

/** Every page in the app slides in softly instead of snapping; with "reduce motion" on it simply appears, and every
 * framer-motion animation inside follows the device setting. The wrapper is always rendered so server and browser markup match. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0 } : { duration: 0.26, ease: [0.2, 0.9, 0.3, 1] }}>
        {children}
      </motion.div>
    </MotionConfig>
  );
}
