"use client";
import dynamic from "next/dynamic";
import { Lochi } from "@/components/Lochi";
import { useCapability, useReducedMotion } from "@/labs/capability";

const Scene = dynamic(() => import("./Hero3DScene"), { ssr: false, loading: () => <Lochi mood="welcome" size={140} /> });

/** Live 3D Lochi where WebGL is available; the flat SVG mascot otherwise (or with reduced motion). */
export function HeroLochi({ big = false }: { big?: boolean }) {
  const cap = useCapability();
  const reduced = useReducedMotion();
  // useCapability is null on the server and during hydration, so the 3D scene only ever mounts on the client
  return (
    <div className={big ? "grid h-full w-full place-items-center" : "grid h-56 w-56 place-items-center"} data-testid="hero">
      {(cap === "ok-high" || cap === "ok-low") && !reduced ? <Scene big={big} /> : <Lochi mood="welcome" size={big ? 240 : 140} />}
    </div>
  );
}
