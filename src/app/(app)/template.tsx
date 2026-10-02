"use client";
import { motion, useReducedMotion } from "framer-motion";

/** Every page in the app slides in softly instead of snapping. The wrapper is always rendered so server and browser markup match. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, ease: [0.2, 0.9, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}
