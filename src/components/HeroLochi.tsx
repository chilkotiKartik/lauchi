"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Lochi } from "@/components/Lochi";
import { useCapability, useReducedMotion } from "@/labs/capability";

const Scene = dynamic(() => import("./Hero3DScene"), { ssr: false, loading: () => <Lochi mood="welcome" size={140} /> });

/** Live 3D Lochi where WebGL is available; the flat SVG mascot otherwise (or with reduced motion). */
export function HeroLochi({ big = false }: { big?: boolean }) {
  const cap = useCapability();
  const reduced = useReducedMotion();
  // Wait for the page to settle so the 3D bundle never competes with first paint.
  const [ready, setReady] = useState(false);
  useEffect(() => { const id = setTimeout(() => setReady(true), 1200); return () => clearTimeout(id); }, []);
  return (
    <div className={big ? "grid h-full w-full place-items-center" : "grid h-56 w-56 place-items-center"} data-testid="hero">
      {ready && cap === "ok-high" && !reduced ? <Scene big={big} /> : <Lochi mood="welcome" size={big ? 240 : 140} />}
    </div>
  );
}
