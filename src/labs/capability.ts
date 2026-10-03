"use client";
import { useSyncExternalStore } from "react";

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
function getCapability() {
  if (!cached) cached = detect();
  return cached;
}

const emptySubscribe = () => () => {};

export function useCapability() {
  return useSyncExternalStore(
    emptySubscribe,
    getCapability,
    () => null
  );
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || typeof matchMedia === "undefined") return () => {};
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotion() {
  if (typeof window === "undefined" || typeof matchMedia === "undefined") return false;
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false
  );
}
