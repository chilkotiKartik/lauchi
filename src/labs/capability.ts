"use client";
import { useEffect, useState } from "react";

function detect(): "ok-high" | "ok-low" | "none" {
  if (typeof window === "undefined" || typeof document === "undefined") return "none";
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | WebGL2RenderingContext | null;
    if (!gl) return "none";
    gl.getExtension("WEBGL_lose_context")?.loseContext(); // hand the probe context back so it never counts against the browser's limit
    const nav = navigator as Navigator & { deviceMemory?: number };
    const weak = (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
    return weak ? "ok-low" : "ok-high";
  } catch {
    return "none";
  }
}

let cached: "ok-high" | "ok-low" | "none" | null = null;

export function useCapability() {
  const [cap, setCap] = useState<"ok-high" | "ok-low" | "none" | null>(cached);
  useEffect(() => {
    if (!cached) cached = detect();
    setCap(cached);
  }, []);
  return cap;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof matchMedia !== "undefined") {
      const mq = matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);
  return reduced;
}
